<script setup lang="ts">
import { ColouredBadge, CountryLink, TableCellGroup, TableHeaderGroup, TableHeaderName, TableHeaderSort, UButton, ULink } from "#components"
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
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: events, status } = await useFetch<TournamentLowestRankedType[]>("/api/tournaments/lowest-ranked", {
  key: `tournament-lowest-ranked-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<TournamentLowestRankedType>()

const columns = computed<TableColumn<TournamentLowestRankedType>[]>(() => [
  {
    accessorKey: "round",
    meta: { class: { td: "font-semibold" } },
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Round" }),
    cell: ({ row, cell }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "round" }, () => cell.getValue())
  },
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row, cell }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: cell.getValue() as string })
      )
  },
  {
    accessorKey: "type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Type", type: "alpha" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "type" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.original.type })
      )
  },
  {
    accessorKey: "rank",
    aggregationFn: "max",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Rank", type: "number" })
  },
  {
    accessorKey: "year",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Year", type: "number" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            to: { name: "event", params: { id, name, year: row.original.year, eid: row.original.id } },
            class: "hover-link default-link w-fit"
          },
          () => row.original.year
        )
      }
    }
  },
  columnHelper.group({
    header: "Player",
    columns: [
      {
        id: "country",
        accessorKey: "player.country.name",
        filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Country", type: "alpha" }),
        cell: ({ row }) =>
          h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "country" }, () =>
            h(CountryLink, { country: row.original.player.country, iconOnly: true, class: "mx-auto" })
          )
      },
      {
        id: "player_name",
        accessorFn: row => `${row.player.last_name}, ${row.player.first_name}`,
        filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(
              ULink,
              {
                to: {
                  name: "player",
                  params: { id: row.original.player.id, name: kebabCase(`${row.original.player.first_name}-${row.original.player.last_name}`) }
                },
                class: "hover-link default-link w-fit"
              },
              () => `${row.original.player.first_name} ${row.original.player.last_name}`
            )
          }
        }
      }
    ]
  })
])

const table = useTemplateRef("table")
const columnVisibility = ref({
  tour: tours.length > 1
})
const columnFilters = ref([])
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <client-only>
    <teleport to="#chart-container">
      <tournament-lowest-rank-chart
        v-if="mdAndUp"
        :events
      />
    </teleport>
  </client-only>
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
    :data="events"
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
        :message="`No players found for ${tournamentName}`"
      />
    </template>
  </u-table>
</template>
