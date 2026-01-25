<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"

const router = useRouter()

// Expose table ref
const table = useTemplateRef("table")
defineExpose({ table })

// Models
const results = defineModel<PlayersResultsType[]>("results")
const status = defineModel<AsyncDataRequestStatus>("status")

// Filters
const tours = useRouteQuery("tour", null, { transform: toArray })
const players = useRouteQuery("player", null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})
const countries = useRouteQuery("country", null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})
const coaches = useRouteQuery("coach", null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})
const min_year = useRouteQuery("min_year", null, { transform: Number })
const max_year = useRouteQuery("max_year", null, { transform: Number })

// Grouping
const grouping = useRouteQuery<string | null>("grouping", null)

// Sorting
const sortField = useRouteQuery("sorting", null, {
  transform: {
    get: parseSort,
    set: serialiseSort
  }
})

// Ensure that grouped column is always shown first
const columnOrder = computed(() => {
  const allColumns = ["tour", "status", "country", "name", "first_tournament_year", "last_tournament_year", "coaches"]

  if (grouping.value) {
    if (grouping.value === "min_year") {
      allColumns.splice(allColumns.indexOf("first_tournament_year"), 1)
      return ["first_tournament_year", ...allColumns]
    }
    if (grouping.value === "max_year") {
      allColumns.splice(allColumns.indexOf("last_tournament_year"), 1)
      return ["last_tournament_year", ...allColumns]
    }
    return [grouping.value, ...allColumns.filter(c => c !== grouping.value)]
  }

  return allColumns
})

const columnVisibility = ref({
  status: false
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

    const row = table.value?.tableApi.getRow(newlyOpenedId) as TableRow<PlayersResultsType> | undefined

    if (!row) return

    const dataRow = results.value.find(r => r.id === row.original.id)
    const idx = results.value.findIndex(r => r.id === row.original.id)
    if (!dataRow || idx === -1) return

    if (dataRow.has_children && dataRow.subRows.length === 0) keyToFetch = "year" in dataRow.group ? dataRow.group.year : dataRow.group.id

    if (!keyToFetch) return

    set(status, "pending")

    await $fetch<PlayersResultsType[]>("/api/players/group-row-results", {
      method: "POST",
      body: {
        sortField: sortField.value,
        grouping: grouping.value,
        key: keyToFetch,
        tours: tours.value,
        players: players.value,
        countries: countries.value,
        coaches: coaches.value,
        min_year: min_year.value,
        max_year: max_year.value
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
const handleSelectRow = (_e: Event, row: TableRow<PlayersResultsType>) => {
  if (row.original.__group) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "player",
      params: {
        id: row.original.id,
        name: row.original.first_name ? kebabCase(`${row.original.first_name}-${row.original.last_name}`) : "—"
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
    :data="results"
    :columns="playerColumns"
    sticky
    :loading="status === 'pending'"
    :grouping-options="{ manualGrouping: true }"
    @select="handleSelectRow"
    render-fallback-value="—"
    :get-sub-rows="(row: PlayersResultsType) => <PlayersResultsType[]>row.subRows"
    :column-order
    :column-visibility
    :grouping="grouping ? [grouping] : []"
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        message="No players found"
        :icon="ICONS.peopleOff"
      >
        <dev-only>
          <player-create />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
