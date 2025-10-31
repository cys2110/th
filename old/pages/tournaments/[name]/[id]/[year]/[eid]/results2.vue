<script setup lang="ts">
import {
  ColouredBadge,
  CountryLink,
  MatchScoreItem,
  TableCellGroup,
  TableHeaderFilter,
  TableHeaderGroup,
  TableHeaderName,
  TableHeaderRange,
  TableHeaderSort,
  UBadge,
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

definePageMeta({ name: "results" })
const {
  params: { id, year, name, eid }
} = useRoute("results")
const {
  ui: { icons }
} = useAppConfig()

const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")

// API call
const { data: matches, status } = await useFetch<MatchInterface[]>("/api/events/results", {
  key: `results-table-${eid}`,
  query: { id: eid },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<MatchInterface>()

const columns = computed<TableColumn<MatchInterface>[]>(() => [
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
    accessorKey: "round",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Round" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "round" }, () => row.original.round)
  },
  {
    id: "date",
    accessorFn: row => (row.date ? getDate(row.date) : undefined),
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Date", type: "number" }),
    cell: ({ row, cell }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        if (cell.getValue()) {
          return useDateFormat(cell.getValue() as any, "dddd DD MMMM, YYYY").value
        }
      }
    }
  },
  {
    id: "duration",
    accessorFn: row => (row.duration ? row.duration.hours * 60 * 60 + row.duration.minutes * 60 + row.duration.seconds : undefined),
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Duration", type: "number" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        const duration = row.original.duration
        if (duration) {
          return `${duration.hours.toString().padStart(2, "0")}:${duration.minutes.toString().padStart(2, "0")}:${duration.seconds
            .toString()
            .padStart(2, "0")}`
        }
      }
    }
  },
  {
    accessorKey: "court",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Court", type: "alpha" })
  },
  {
    accessorKey: "umpire",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Umpire" }),
    cell: ({ row, cell }) => {
      if ((!row.getIsGrouped() || grouping.value.length === 0) && row.original.umpire) {
        return cell.getValue()
      }
    }
  },
  columnHelper.group({
    header: "Winner",
    columns: [
      {
        id: "winner_country",
        accessorFn: row => row.winners.players.map(player => player.country.name),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: "arrIncludesSome",
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return row.original.winners.players.map(player =>
              h(CountryLink, { country: player.country, key: `${player.id}-${player.country.id}`, class: "mx-auto" })
            )
          }
        }
      },
      {
        id: "winner_name",
        accessorFn: row => row.winners.players.map(player => `${player.last_name}, ${player.first_name}`),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: (row, columnId, filterValue) => filterIncludesName(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(
              "div",
              { class: "flex flex-col items-center" },
              row.original.winners.players.map(player =>
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
        id: "winner_seed",
        accessorFn: row =>
          row.round.includes("Qualifying") ? row.winners.players[0]!.q_seed ?? undefined : row.winners.players[0]!.seed ?? undefined,
        header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Seed" }),
        cell: ({ cell, row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      },
      {
        id: "winner_status",
        accessorFn: row =>
          row.round.includes("Qualifying") ? row.winners.players[0]!.q_status ?? undefined : row.winners.players[0]!.status ?? undefined,
        filterFn: "arrIncludesSome",
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Status" }),
        cell: ({ cell, row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    header: "Loser",
    columns: [
      {
        id: "loser_country",
        accessorFn: row => row.losers.players.map(player => player.country.name),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: "arrIncludesSome",
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return row.original.losers.players.map(player =>
              h(CountryLink, { country: player.country, key: `${player.id}-${player.country.id}`, class: "mx-auto" })
            )
          }
        }
      },
      {
        id: "loser_name",
        accessorFn: row => row.losers.players.map(player => `${player.last_name}, ${player.first_name}`),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: (row, columnId, filterValue) => filterIncludesName(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(
              "div",
              { class: "flex flex-col items-center" },
              row.original.losers.players.map(player =>
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
        id: "loser_seed",
        accessorFn: row => (row.round.includes("Qualifying") ? row.losers.players[0]!.q_seed ?? undefined : row.losers.players[0]!.seed ?? undefined),
        header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Seed" }),
        cell: ({ cell, row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      },
      {
        id: "loser_status",
        accessorFn: row =>
          row.round.includes("Qualifying") ? row.losers.players[0]!.q_status ?? undefined : row.losers.players[0]!.status ?? undefined,
        filterFn: "arrIncludesSome",
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Status" }),
        cell: ({ cell, row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return cell.getValue()
          }
        }
      }
    ]
  }),
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(MatchScoreItem, {
          draw: row.original.draw,
          tour: row.original.tour,
          type: row.original.type,
          sets: row.original.sets,
          tournament: { id: parseInt(id), name },
          id: parseInt(eid),
          year: parseInt(year),
          match_no: row.original.match_no,
          incomplete: row.original.incomplete,
          stats: row.original.stats,
          centred: true
        })
      }
    }
  }
])

const table = useTemplateRef("table")
const columnVisibility = computed(() => ({ tour: tours.value.length > 1 }))
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <event-wrapper>
    <template #toolbar>
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
    </template>

    <u-table
      ref="table"
      :data="matches"
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
        <table-empty-message :message="`No results found for ${tournamentName} ${year}`" />
      </template>
    </u-table>
  </event-wrapper>
</template>
