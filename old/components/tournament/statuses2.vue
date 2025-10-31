<script setup lang="ts">
import {
  ColouredBadge,
  CountryLink,
  TableCellGroup,
  TableHeaderFilter,
  TableHeaderGroup,
  TableHeaderName,
  TableHeaderRange,
  UButton,
  ULink
} from "#components"
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
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: players, status } = await useFetch<EntryInterface[]>("/api/tournaments/statuses", {
  key: `tournament-statuses-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<EntryInterface>()

const columns = computed<TableColumn<EntryInterface>[]>(() => [
  {
    id: "status",
    accessorFn: row => STATUSES[row.status as keyof typeof STATUSES].longName,
    meta: { class: { td: "font-semibold" } },
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Status" }),
    cell: ({ cell, row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "status" }, () => cell.renderValue())
  },
  {
    accessorKey: "year",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Year" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            to: { name: "event", params: { id, name, year: row.original.year, eid: row.original.eid } },
            class: "hover-link default-link font-semibold"
          },
          () => row.original.year
        )
      }
    },
    footer: ({ column }) => "Events: " + column.getFacetedUniqueValues().size
  },
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.getValue("tour") as string })
      ),
    footer: ({ table }) => {
      const uniqueStatuses = Array.from(table.getColumn("status")!.getFacetedUniqueValues().keys())
      if (uniqueStatuses.length > 0) {
        const count = table.getFilteredRowModel().rows.filter(row => row.getValue("status") === uniqueStatuses[0]).length
        return `${uniqueStatuses[0]}s: ${count}`
      }
    }
  },
  {
    accessorKey: "type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Type" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "type" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.getValue("type") as string })
      ),
    footer: ({ table }) => {
      const uniqueStatuses = Array.from(table.getColumn("status")!.getFacetedUniqueValues().keys())
      if (uniqueStatuses.length > 1) {
        const count = table.getFilteredRowModel().rows.filter(row => row.getValue("status") === uniqueStatuses[1]).length
        return `${uniqueStatuses[1]}s: ${count}`
      }
    }
  },
  columnHelper.group({
    header: "Player(s)",
    columns: [
      {
        id: "country",
        accessorFn: row => row.players.map(player => player.country.name),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: "arrIncludes",
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return row.original.players.map(player =>
              h(CountryLink, {
                country: player.country,
                key: `${row.original.year}-${player.id}-${player.country.id}`,
                class: "mx-auto"
              })
            )
          }
        },
        footer: ({ table }) => {
          const uniqueStatuses = Array.from(table.getColumn("status")!.getFacetedUniqueValues().keys())
          if (uniqueStatuses.length > 2) {
            const count = table.getFilteredRowModel().rows.filter(row => row.getValue("status") === uniqueStatuses[2]).length
            return `${uniqueStatuses[2]}s: ${count}`
          }
        }
      },
      {
        id: "first_name",
        accessorFn: row => row.players.map(player => `${player.last_name}, ${player.first_name}`),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: (row, columnId, filterValue) => filterIncludesName(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(
              "div",
              { class: "flex flex-col items-center" },
              row.original.players.map(player =>
                h(
                  ULink,
                  {
                    key: player.id,
                    to: { name: "player", params: { id: player.id, name: kebabCase(`${player.first_name} ${player.last_name}`) } },
                    class: "hover-link default-link w-fit"
                  },
                  () => `${player.first_name} ${player.last_name}`
                )
              )
            )
          }
        },
        footer: ({ table }) => {
          const uniqueStatuses = Array.from(table.getColumn("status")!.getFacetedUniqueValues().keys())
          if (uniqueStatuses.length > 3) {
            const count = table.getFilteredRowModel().rows.filter(row => row.getValue("status") === uniqueStatuses[3]).length
            return `${uniqueStatuses[3]}s: ${count}`
          }
        }
      }
    ]
  })
])

const table = useTemplateRef("table")
const columnVisibility = ref({ tour: tours.length > 1 })
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
    :data="players"
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
      <table-empty-message
        :icon="ICONS.noTournament"
        :message="`No qualifiers, lucky losers, alternates or wild cards have won ${tournamentName}`"
      />
    </template>
  </u-table>
</template>
