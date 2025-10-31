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
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")

// API call
const { data: seeds, status } = await useFetch<SeedInterface[]>("/api/events/seeds", {
  key: `event-seeds-${eid}`,
  query: { id: eid },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<SeedInterface>()

const columns = computed<TableColumn<SeedInterface>[]>(() => [
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
  {
    accessorKey: "seed",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Seed" }),
    cell: ({ row, cell }) => (!row.getIsGrouped() || grouping.value.length === 0 ? cell.getValue() : undefined)
  },
  columnHelper.group({
    header: "Player(s)",
    columns: [
      {
        id: "country",
        accessorFn: row => row.team.map(player => player.country.name),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
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
      },
      {
        id: "rank",
        accessorFn: row => row.team.map(player => player.rank),
        sortingFn: (rowA, rowB, columnId) =>
          Math.min(...(rowA.getValue(columnId) as number[])) < Math.min(...(rowB.getValue(columnId) as number[])) ? -1 : 1,
        aggregationFn: (leafRows, childRows) => {
          const ranks = childRows.map(row => row.original.team.map(player => player.rank)).flat()
          if (ranks.length === 0) {
            return undefined
          } else {
            const sortedRanks = ranks.sort((a, b) => (a ?? 0) - (b ?? 0))
            return `${sortedRanks[0]}-${sortedRanks[sortedRanks.length - 1]}`
          }
        },
        header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Rank (at event)" }),
        cell: ({ cell, row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(
              "div",
              { class: "flex flex-col" },
              row.original.team.map(player => h("div", {}, [player.rank]))
            )
          } else {
            return cell.getValue()
          }
        }
      }
    ]
  }),
  {
    accessorKey: "rank",
    aggregationFn: "extent",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Rank (at draw)" }),
    cell: ({ cell, row }) => {
      return row.getIsGrouped() ? `${(cell.getValue() as number[])[0]}-${(cell.getValue() as number[])[1]}` : cell.getValue()
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
  <dashboard-subpanel
    id="seeds"
    title="Seeds"
    :icon="ICONS.seeds"
    class="max-h-200"
  >
    <template #right>
      <event-seeds-chart
        v-if="seeds.length && mdAndUp"
        :seeds
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
      :data="seeds"
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
          :icon="ICONS.noPeople"
          :message="`No seeds found for ${tournamentName} ${year}`"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
