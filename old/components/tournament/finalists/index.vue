<script setup lang="ts">
import { ColouredBadge, CountryLink, TableCellGroup, TableHeaderGroup, TableHeaderName, TableHeaderRange } from "#components"
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
  params: { id }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: finalists, status } = await useFetch<TournamentFinalistType[]>("/api/tournaments/finalists", {
  key: `tournament-finalists-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<TournamentFinalistType>()

const columns: TableColumn<TournamentFinalistType>[] = [
  {
    id: "tour",
    accessorKey: "player.tour",
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { label: row.getValue("tour") as string, class: "mx-auto" })
      )
  },
  columnHelper.group({
    header: "Player",
    columns: [
      {
        id: "country",
        accessorKey: "player.country.name",
        header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) =>
          h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "country" }, () =>
            h(CountryLink, {
              country: row.original.player.country,
              class: "mx-auto"
            })
          )
      },
      {
        id: "player_name",
        accessorFn: row => `${row.player.last_name}, ${row.player.first_name}`,
        filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return `${row.original.player.first_name} ${row.original.player.last_name}`
          }
        }
      }
    ]
  }),
  {
    accessorKey: "finals",
    header: ({ column }) =>
      h(TableHeaderRange, {
        column: column as Column<unknown>,
        label: "Finals Played"
      }),
    cell: ({ row, cell }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return cell.getValue()
      }
    }
  },
  columnHelper.group({
    header: "Singles",
    columns: [
      {
        accessorKey: "singles_wins",
        header: ({ column }) =>
          h(TableHeaderRange, {
            column: column as Column<unknown>,
            label: "Wins"
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      },
      {
        accessorKey: "singles_losses",
        header: ({ column }) =>
          h(TableHeaderRange, {
            column: column as Column<unknown>,
            label: "Losses"
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      },
      {
        id: "singles_percent",
        accessorFn: row => `${row.singles_wins + row.singles_losses ? percentage(row.singles_wins, row.singles_wins + row.singles_losses) : 0}%`,
        header: ({ column }) =>
          h(TableHeaderRange, {
            column: column as Column<unknown>,
            label: "Win %"
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    header: "Doubles",
    columns: [
      {
        accessorKey: "doubles_wins",
        header: ({ column }) =>
          h(TableHeaderRange, {
            column: column as Column<unknown>,
            label: "Wins"
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      },
      {
        accessorKey: "doubles_losses",
        header: ({ column }) =>
          h(TableHeaderRange, {
            column: column as Column<unknown>,
            label: "Losses"
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      },
      {
        id: "doubles_percent",
        accessorFn: row => `${row.doubles_wins + row.doubles_losses ? percentage(row.doubles_wins, row.doubles_wins + row.doubles_losses) : 0}%`,
        header: ({ column }) =>
          h(TableHeaderRange, {
            column: column as Column<unknown>,
            label: "Win %"
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      }
    ]
  })
]

const table = useTemplateRef("table")
const columnVisibility = ref({
  tour: tours.length > 1
})
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const handleSelectRow = (row: TableRow<TournamentFinalistType>) => {
  navigateTo({
    name: "player",
    params: { id: row.original.player.id, name: kebabCase(`${row.original.player.first_name}-${row.original.player.last_name}`) }
  })
}
</script>

<template>
  <client-only>
    <teleport to="#chart-container">
      <tournament-finalists-chart
        v-if="mdAndUp"
        :finalists
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
    :data="finalists"
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
    @select="handleSelectRow"
    :ui="{ tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
  >
    <template #loading>
      <table-loading-icon />
    </template>

    <template #empty>
      <table-empty-message
        :icon="ICONS.noTournament"
        message="No finalists found for {{ tournamentName }}"
      />
    </template>
  </u-table>
</template>
