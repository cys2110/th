<script setup lang="ts">
import { PlayersLink, UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/scores-stats", {
  query: { id },
  default: () => []
})

const columnHelper = createColumnHelper<TournamentScoresStatsType>()
const columns: TableColumn<TournamentScoresStatsType>[] = [
  {
    accessorKey: "tour",
    header: "Tour",
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.tour,
        color: row.original.tour
      })
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: {
            name: "edition",
            params: {
              id,
              name,
              year: row.original.year,
              edId: row.original.id
            }
          }
        },
        () => row.original.year
      )
  },
  {
    id: "team",
    header: "Team",
    cell: ({ row }) =>
      row.original.team.map(player =>
        h(PlayersLink, {
          key: player.id,
          player,
          class: "mx-auto"
        })
      )
  },
  columnHelper.group({
    header: "Sets",
    columns: [
      {
        id: "sets_wl",
        header: "Win-Loss",
        cell: ({ row }) => `${row.original.sets_won}-${row.original.sets_lost}`
      },
      {
        id: "sets_pc",
        header: "Win %",
        cell: ({ row }) => `${percentage(row.original.sets_won, row.original.sets_won + row.original.sets_lost)}%`
      }
    ]
  }),
  columnHelper.group({
    header: "Games",
    columns: [
      {
        id: "games_wl",
        header: "Win-Loss",
        cell: ({ row }) => `${row.original.games_won}-${row.original.games_lost}`
      },
      {
        id: "games_pc",
        header: "Win %",
        cell: ({ row }) => `${percentage(row.original.games_won, row.original.games_won + row.original.games_lost)}%`
      }
    ]
  })
]
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <div class="text-accented text-lg font-semibold">
        <u-icon
          :name="ICONS.scores"
          class="align-middle size-5"
        />
        Winners by Sets and Games Lost
      </div>

      <tournaments-scores-stats-chart
        v-if="data.length"
        :winners="data"
      />
    </div>

    <u-table
      :data
      :columns
      :loading="status === 'pending'"
      sticky
      :ui="{ root: 'max-h-150 my-5' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          message="No data available"
          class="m-2"
        />
      </template>
    </u-table>
  </div>
</template>
