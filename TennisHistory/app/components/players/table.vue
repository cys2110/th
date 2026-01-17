<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"
import { FetchError } from "ofetch"

const grouping = defineModel<string[] | null>("grouping")
const tours = defineModel<string[] | null>("tours")
const players = defineModel<OptionType[] | null>("players")
const countries = defineModel<OptionType[] | null>("countries")
const coaches = defineModel<OptionType[] | null>("coaches")
const sortField = defineModel<SortFieldType[]>("sort-field")
const results = defineModel<PlayersResultsType[]>("results")
const status = defineModel<AsyncDataRequestStatus>("status")

const router = useRouter()
const table = useTemplateRef("table")
defineExpose({ table })

// Computed in order to pass refs
const columns = computed(() => playerColumns(grouping, tours, players, countries, coaches, sortField))

// Ensure that grouped column is always shown first
const columnOrder = computed(() => {
  const columns = ["tour", "status", "country", "name", "first tournament year", "last tournament year", "coaches"]

  if (grouping.value?.length) {
    if (grouping.value.includes("min_year")) {
      columns.splice(columns.indexOf("first tournament year"), 1)
      return ["first tournament year", ...columns]
    }
    if (grouping.value.includes("max_year")) {
      columns.splice(columns.indexOf("last tournament year"), 1)
      return ["last tournament year", ...columns]
    }

    return [...grouping.value, ...columns.filter(c => !grouping.value?.includes(c))]
  }

  return columns
})

const columnVisibility = ref({
  status: false
})

// In grouped mode, only fetch data when row is expanded
watch(
  () => table.value?.tableApi.getState().expanded,
  async (newExpanded, oldExpanded) => {
    if (!grouping.value?.length || !newExpanded || !results.value) return

    let newlyOpenedId: string = ""

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

    if (dataRow.has_children && dataRow.subRows.length === 0) {
      keyToFetch = dataRow.group_key.id || dataRow.group_key.key
    }

    if (!keyToFetch) return

    status.value = "pending"

    const apiRoute =
      grouping.value?.includes("country") ? "/api/players/country-group"
      : grouping.value?.includes("min_year") ? "/api/players/min-year-group"
      : "/api/players/max-year-group"

    try {
      const response = await $fetch<PlayersResultsType[]>(apiRoute, {
        method: "POST",
        body: {
          sortField: sortField.value,
          players: players.value,
          tours: tours.value,
          countries: countries.value,
          coaches: coaches.value,
          key: keyToFetch
        }
      })

      const updated = {
        ...dataRow,
        subRows: response
      }

      results.value = [...results.value.slice(0, idx), updated, ...results.value.slice(idx + 1)]

      status.value = "success"
    } catch (error) {
      if (error instanceof FetchError && error.statusMessage === "Validation errors") {
        console.error(error.statusMessage, error.data?.data.validationErrors)
      } else {
        console.error(error)
      }
    }
  }
)

// handle row selection
const handleSelectRow = (_e: Event, row: TableRow<PlayersResultsType>) => {
  if (row.original.__group) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "player",
      params: {
        id: row.original.id,
        name: row.original.first_name ? kebabCase(`${row.original.first_name} ${row.original.last_name}`) : "—"
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
    :data="results"
    :columns="columns"
    :loading="status === 'pending'"
    sticky
    render-fallback-value="—"
    @select="handleSelectRow"
    :column-order
    :column-visibility
    :grouping="grouping as string[]"
    :grouping-options="{
      manualGrouping: true
    }"
    :get-sub-rows="row => row.subRows"
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
          <players-create />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
