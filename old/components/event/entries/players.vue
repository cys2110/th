<script setup lang="ts">
import { ColouredBadge, CountryLink, TableCellGroup, TableHeaderFilter, TableHeaderGroup, TableHeaderRange, UButton, ULink } from "#components"
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
const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")

// API call
const { data: entries, status } = await useFetch<EntryInterface[]>("/api/events/player-entries", {
  key: `event-player-entries-${eid}`,
  query: { id: eid },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<EntryInterface>()

const columns = computed<TableColumn<EntryInterface>[]>(() => [
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { label: row.original.tour, class: "mx-auto" })
      )
  },
  columnHelper.group({
    id: "players",
    header: "Player(s)",
    columns: [
      {
        accessorKey: "country.name",
        filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(CountryLink, {
              country: row.original.country,
              class: "mx-auto",
              iconOnly: true
            })
          }
        }
      },
      {
        id: "name",
        accessorFn: row => `${row.last_name}, ${row.first_name}`,
        filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) =>
          h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "name" }, () =>
            h(
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
          )
      }
    ]
  }),
  {
    accessorKey: "type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "S/D" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "type" }, () =>
        h(ColouredBadge, { label: row.original.type, class: "mx-auto" })
      )
  },
  {
    accessorKey: "draw",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Draw" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "draw" }, () =>
        h(ColouredBadge, { label: row.original.draw, class: "mx-auto" })
      )
  },
  {
    id: "seed",
    accessorFn: row => (row.draw === "Main" ? row.seed : row.q_seed),
    sortUndefined: "last",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Seed" })
  },
  {
    id: "status",
    accessorFn: row =>
      row.draw === "Main" && row.status
        ? STATUSES[row.status].longName
        : row.draw === "Qualifying" && row.q_status
        ? STATUSES[row.q_status].longName
        : undefined,
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    sortUndefined: "last",
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Status", type: "alpha" })
  },
  {
    accessorKey: "rank",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Rank" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return row.original.rank
      }
    }
  }
])

const table = useTemplateRef("table")
const columnVisibility = computed(() => ({ tour: tours.value?.length > 1 }))
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <div class="flex items-center justify-between mb-5">
    <u-button
      label="Reset Sorting"
      :icon="ICONS.sortAlpha"
      @click="table?.tableApi.resetSorting()"
      size="sm"
    />
    <u-button
      label="Reset Grouping"
      :icon="ICONS.ungroup"
      @click="table?.tableApi.resetGrouping()"
      size="sm"
    />
    <u-button
      label="Reset Filters"
      :icon="ICONS.noFilter"
      @click="table?.tableApi.resetColumnFilters()"
      size="sm"
    />
    <table-visibility
      v-if="table"
      :table="table!"
    />
  </div>

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
    v-on:update:grouping="grouping = $event"
    :grouping-options="grouping_options"
    v-model:column-visibility="columnVisibility"
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <table-loading-icon />
    </template>

    <template #empty>
      <table-empty-message :message="`No entries found for ${tournamentName} ${year}`" />
    </template>
  </u-table>
</template>
