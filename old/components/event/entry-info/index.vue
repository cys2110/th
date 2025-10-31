<script setup lang="ts">
import { ColouredBadge, CountryLink, TableCellGroup, TableHeaderFilter, TableHeaderGroup, ULink } from "#components"
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
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")

// API call
const { data: teams, status } = await useFetch<EntryInfoInterface[]>("/api/events/entry-info", {
  key: `event-entry-info-${eid}`,
  query: { id: eid },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<EntryInfoInterface>()

const columns = computed<TableColumn<EntryInfoInterface>[]>(() => [
  {
    accessorKey: "label",
    meta: { class: { td: "font-semibold" } },
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Entry Info" }),
    cell: ({ row, cell }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "label" }, () => cell.getValue())
  },
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { label: row.original.tour, class: "mx-auto" })
      )
  },
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
  columnHelper.group({
    header: "Player(s)",
    columns: [
      {
        id: "country",
        accessorFn: row => row.team.map(player => player.country.name),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: "arrIncludesSome",
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return row.original.team.map(player =>
              h(CountryLink, {
                country: player.country,
                key: `${player.id}-${player.country.id}`,
                class: "mx-auto",
                iconOnly: true
              })
            )
          }
        }
      },
      {
        id: "name",
        accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: (row, columnId, filterValue) => filterIncludesName(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(
              "div",
              { class: "flex flex-col items-center" },
              row.original.team.map(player =>
                h(
                  ULink,
                  {
                    key: player.id,
                    to: {
                      name: "player",
                      params: { id: player.id, name: kebabCase(`${player.first_name} ${player.last_name}`) }
                    },
                    class: "hover-link default-link w-fit"
                  },
                  () => `${player.first_name} ${player.last_name}`
                )
              )
            )
          }
        }
      }
    ]
  }),
  {
    id: "reason",
    header: "Rank/Reason",
    accessorFn: row => {
      if (row.rank) {
        if (row.status === "PR") return `P${row.rank}`
        return row.rank
      }

      if (row.team[0]?.reason && row.team[0].reason !== "teammate")
        return `${row.type === "Singles" ? "" : `${row.team[0].last_name} - `} ${row.team[0].reason}`
      if (row.team[1]?.reason && row.team[1].reason !== "teammate") return `${row.team[1].last_name} - ${row.team[1].reason}`
      if (row.team_reason) return row.team_reason
    },
    cell: ({ cell, row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return cell.getValue()
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
const sorting = ref([
  { id: "label", desc: false },
  { id: "tour", desc: false },
  { id: "type", desc: true },
  { id: "draw", desc: false }
])
</script>

<template>
  <dashboard-subpanel
    id="entry-info"
    title="Entry Information"
    :icon="icons.info"
    class="max-h-200"
  >
    <template #right>
      <event-entry-info-chart
        v-if="teams.length && mdAndUp"
        :teams
      />
    </template>

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
      :data="teams"
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
      v-model:sorting="sorting"
      :ui="{ td: 'empty:p-0' }"
    >
      <template #loading>
        <table-loading-icon />
      </template>

      <template #empty>
        <table-empty-message :message="`No entry information found for ${tournamentName} ${year}`" />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
