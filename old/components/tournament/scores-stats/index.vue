<script setup lang="ts">
import { ArrayFilterTableHeader, CountryLink, FilterTableHeader, NameTableHeader, RangeTableHeader, UBadge, UButton, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
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
  icons,
  ui: { icons: uIcons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: winners, status } = await useFetch<TournamentScoreStatsType[]>("/api/tournaments/scores-stats", {
  key: `tournament-scores-stats-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<TournamentScoreStatsType>()

const columns = computed<TableColumn<TournamentScoreStatsType>[]>(() => [
  {
    id: "expand",
    cell: ({ row }: { row: any }) => {
      if (row.getIsGrouped()) {
        return h(UButton, {
          variant: "link",
          color: "neutral",
          class: "mr-2",
          size: "xs",
          icon: uIcons.chevronDoubleRight,
          ui: {
            leadingIcon: row.getIsExpanded() ? "rotate-90 transition-transform duration-200" : "transition-transform duration-200"
          },
          onClick: () => row.toggleExpanded()
        })
      }
    }
  },
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) =>
      h(FilterTableHeader, {
        column: column as Column<unknown>,
        label: "Tour",
        type: "alpha"
      }),
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.depth === 0) {
        return h(UBadge, {
          label: row.original.tour,
          color: getTourColour(row.original.tour),
          class: "font-semibold"
        })
      }
    }
  },
  {
    accessorKey: "type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) =>
      h(FilterTableHeader, {
        column: column as Column<unknown>,
        label: "S/D",
        type: "alpha"
      }),
    cell: ({ row }) => {
      if (row.getIsGrouped() && (tours.length > 1 ? row.depth === 1 : row.depth === 0)) {
        return h(UBadge, {
          label: row.original.type,
          color: getMatchTypeColour(row.original.type),
          class: "font-semibold"
        })
      }
    }
  },
  {
    accessorKey: "year",
    header: ({ column }) => h(RangeTableHeader, { column: column as Column<unknown>, label: "Year" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(
          ULink,
          {
            to: { name: "event", params: { id, name, year: row.original.year, eid: row.original.id } },
            class: "hover-link default-link font-semibold"
          },
          () => row.original.year
        )
      }
    }
  },
  columnHelper.group({
    header: "Player(s)",
    columns: [
      {
        id: "country",
        accessorFn: row => row.team.map(player => player.country.name),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: "arrIncludesSome",
        header: ({ column }) => h(ArrayFilterTableHeader, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            return row.original.team.map(player =>
              h(CountryLink, {
                key: player.country.id,
                country: player.country,
                class: "mx-auto"
              })
            )
          }
        }
      },
      {
        id: "name",
        accessorFn: row => row.team.map(player => `${player.first_name} ${player.last_name}`),
        sortingFn: (rowA, rowB, columnId) => arraySorting(rowA, rowB, columnId),
        filterFn: (row, columnId, filterValue) => filterIncludesName(row, columnId, filterValue),
        header: ({ column }) => h(NameTableHeader, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            return h(
              "div",
              {
                class: "flex flex-col items-center"
              },
              row.original.team.map(player =>
                h(
                  ULink,
                  {
                    key: `${row.original.id}-${player.id}`,
                    to: { name: "player", params: { id: player.id, name: kebabCase(`${player.first_name}, ${player.last_name}`) } },
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
  columnHelper.group({
    header: "Sets",
    columns: [
      {
        accessorKey: "sets_won",
        aggregationFn: "mean",
        cell: row => Math.round(row.getValue() as number),
        header: ({ column }) =>
          h(RangeTableHeader, {
            column: column as Column<unknown>,
            label: "Won"
          })
      },
      {
        accessorKey: "sets_lost",
        aggregationFn: "mean",
        cell: row => Math.round(row.getValue() as number),
        header: ({ column }) =>
          h(RangeTableHeader, {
            column: column as Column<unknown>,
            label: "Lost"
          })
      },
      {
        id: "sets_pc",
        accessorFn: row => (row.sets_won + row.sets_lost ? percentage(row.sets_won, row.sets_won + row.sets_lost) : 0),
        aggregationFn: "mean",
        header: ({ column }) =>
          h(RangeTableHeader, {
            column: column as Column<unknown>,
            label: "Win %"
          }),
        cell: row => `${Math.round(row.getValue() as number)}%`
      }
    ]
  }),
  columnHelper.group({
    header: "Games",
    columns: [
      {
        accessorKey: "games_won",
        aggregationFn: "mean",
        cell: row => Math.round(row.getValue() as number),
        header: ({ column }) =>
          h(RangeTableHeader, {
            column: column as Column<unknown>,
            label: "Won"
          })
      },
      {
        accessorKey: "games_lost",
        aggregationFn: "mean",
        cell: row => Math.round(row.getValue() as number),
        header: ({ column }) =>
          h(RangeTableHeader, {
            column: column as Column<unknown>,
            label: "Lost"
          })
      },
      {
        id: "games_pc",
        accessorFn: row => (row.games_won + row.games_lost ? percentage(row.games_won, row.games_won + row.games_lost) : 0),
        aggregationFn: "mean",
        cell: row => `${Math.round(row.getValue() as number)}%`,
        header: ({ column }) =>
          h(RangeTableHeader, {
            column: column as Column<unknown>,
            label: "Win %"
          })
      }
    ]
  })
])

const columnVisibility = computed(() => ({
  tour: tours.length > 1
}))
const columnFilters = ref([])
const grouping = computed(() => (tours.length > 1 ? ["tour", "type"] : ["type"]))
const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: false,
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <client-only>
    <teleport to="#dashboard-right">
      <tournament-scores-stats-chart
        v-if="mdAndUp"
        :winners
      />
    </teleport>
  </client-only>
  <u-table
    :data="winners"
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
    :ui="{ td: 'empty:p-0', root: 'max-h-150' }"
  >
    <template #loading>
      <u-icon
        :name="uIcons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <div class="flex justify-center items-center w-full gap-2 text-error">
        <u-icon
          :name="icons.noTournament"
          class="text-base"
        />
        No winners found for {{ tournamentName }}
      </div>
    </template>
  </u-table>
</template>
