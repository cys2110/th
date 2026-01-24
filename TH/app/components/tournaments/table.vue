<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"

const results = defineModel<TournamentResultsType[]>("results")
const status = defineModel<AsyncDataRequestStatus>("status")

const tours = useRouteQuery("tours", null, { transform: toArray })
const tournaments = useRouteQuery("tournaments", null, {
  transform: {
    get: parseNumberOption,
    set: serialiseOption
  }
})
const established = useRouteQuery("established", null, { transform: Number })
const abolished = useRouteQuery("abolished", null, { transform: Number })
const grouping = useRouteQuery<string | null>("grouping", null)
const sortField = useRouteQuery("sorting", null, {
  transform: {
    get: parseSort,
    set: serialiseSort
  }
})

const router = useRouter()
const table = useTemplateRef("table")
defineExpose({ table })

// Ensure that grouped column is always shown first
const columnOrder = computed(() => {
  const allColumns = ["tours", "name", "established", "abolished"]

  if (grouping.value) {
    return [grouping.value, ...allColumns.filter(c => c !== grouping.value)]
  }

  return allColumns
})

// In grouped mode, only fetch data when row is expanded
watch(
  () => table.value?.tableApi.getState().expanded,
  async (newExpanded, oldExpanded) => {
    if (!grouping.value || !newExpanded || !results.value) return

    let newlyOpenedId: string = ""

    // Get the ID of the newly opened row - rows can only be opened one at a time
    for (const [rowId, isOpen] of Object.entries(newExpanded)) {
      const wasOpen = oldExpanded?.[rowId as keyof typeof oldExpanded] ?? false
      if (isOpen && !wasOpen) newlyOpenedId = rowId
    }

    if (!newlyOpenedId) return

    let keyToFetch: string | number = ""

    const row = table.value?.tableApi.getRow(newlyOpenedId) as TableRow<TournamentResultsType> | undefined

    if (!row) return

    const dataRow = results.value.find(r => r.id === row.original.id)
    const idx = results.value.findIndex(r => r.id === row.original.id)
    if (!dataRow || idx === -1) return

    if (dataRow.has_children && dataRow.subRows.length === 0) keyToFetch = dataRow.group.year

    if (!keyToFetch) return

    set(status, "pending")

    await $fetch<TournamentResultsType[]>("/api/tournaments/group-row-results", {
      method: "POST",
      body: {
        sortField: sortField.value,
        grouping: grouping.value,
        key: keyToFetch,
        tours: tours.value,
        tournaments: tournaments.value,
        established: established.value,
        abolished: abolished.value
      }
    })
      .then(response => {
        const updated = {
          ...dataRow,
          subRows: response
        }

        // Update the row in the results array
        results.value = [...results.value!.slice(0, idx), updated, ...results.value!.slice(idx + 1)]

        set(status, "success")
      })
      .catch(error => {
        if (error.statusMessage) {
          console.error(error.statusMessage, error.data?.data.validationErrors)
        } else {
          console.error(error)
        }

        set(status, "error")
      })
  }
)

// Handle row selection
const handleSelectRow = (_e: Event, row: TableRow<TournamentResultsType>) => {
  if (row.original.__group) {
    row.toggleExpanded()
  } else {
    const { id, name } = row.original

    router.push({
      name: "tournament",
      params: {
        id,
        name: kebabCase(name)
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
    :data="results"
    :columns="tournamentColumns"
    :loading="status === 'pending'"
    sticky
    render-fallback-value="—"
    @select="handleSelectRow"
    :column-order
    :grouping="grouping ? [grouping] : []"
    :grouping-options="{ manualGrouping: true }"
    :get-sub-rows="(row: TournamentResultsType) => <TournamentResultsType[]>row.subRows"
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        message="No tournaments found"
        :icon="ICONS.trophyOff"
      >
        <dev-only>
          <tournament-update />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
