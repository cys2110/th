<script setup lang="ts">
import { ColouredBadge, CountryLink, TableCellGroup, TableHeaderGroup, TableHeaderName, TableHeaderRange, UButton, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import {
  type Column,
  createColumnHelper,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"

const {
  params: { eid, year }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")

interface APIResponse extends EntryInterface {
  singles_rank: number | null
  doubles_rank: number | null
}

// API call
const { data: entries, status } = await useFetch<APIResponse[]>("/api/events/country-entries", {
  key: `event-entries-${eid}`,
  query: { id: eid },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<APIResponse>()

const columns = computed<TableColumn<APIResponse>[]>(() => [
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { label: row.getValue("tour") as string, class: "mx-auto" })
      )
  },
  {
    id: "country",
    accessorKey: "country.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Country" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "country" }, () =>
        h(CountryLink, { country: row.original.country, class: "mx-auto", iconOnly: true })
      )
  },
  {
    id: "name",
    accessorFn: row => `${row.last_name}, ${row.first_name}`,
    filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            key: row.original.id,
            to: {
              name: "player",
              params: { id: row.original.id, name: kebabCase(`${row.original.first_name} ${row.original.last_name}`) }
            },
            class: "hover-link default-link w-fit"
          },
          () => `${row.original.first_name} ${row.original.last_name}`
        )
      }
    }
  },
  {
    accessorKey: "singles_rank",
    aggregationFn: "min",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Singles Rank" })
  },
  {
    accessorKey: "doubles_rank",
    aggregationFn: "min",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Doubles Rank" })
  }
])

const columnFilters = ref([])
const columnVisibility = computed(() => ({
  tour: tours.value?.length > 1
}))
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const table = useTemplateRef("table")
</script>

<template>
  <u-table
    ref="table"
    :data="entries"
    :columns
    :loading="['idle', 'pending'].includes(status)"
    sticky
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :grouping
    :grouping-options="grouping_options"
    v-model:columnFilters="columnFilters"
    v-model:column-visibility="columnVisibility"
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <table-loading-icon />
    </template>

    <template #empty>
      <table-empty-message
        :icon="ICONS.noPlayer"
        :message="`No entries available for ${tournamentName} ${year}`"
      />
    </template>
  </u-table>
</template>
