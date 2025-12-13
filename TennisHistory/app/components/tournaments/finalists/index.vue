<script setup lang="ts">
import { PlayersLink, UBadge } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { id }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/finalists", {
  query: { id },
  default: () => []
})

const columnHelper = createColumnHelper<TournamentFinalistType>()
const columns: TableColumn<TournamentFinalistType>[] = [
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
    id: "player",
    header: "Player",
    cell: ({ row }) => h(PlayersLink, { player: row.original, class: "mx-auto" })
  },
  columnHelper.group({
    header: "Singles",
    columns: [
      {
        id: "singles_wl",
        header: "Win-Loss",
        cell: ({ row }) => `${row.original.singles_wins}-${row.original.singles_losses}`
      },
      {
        id: "singles_pc",
        header: "Win %",
        cell: ({ row }) => `${percentage(row.original.singles_wins, row.original.singles_wins + row.original.singles_losses)}%`
      }
    ]
  }),
  columnHelper.group({
    header: "Doubles",
    columns: [
      {
        id: "doubles_wl",
        header: "Win-Loss",
        cell: ({ row }) => `${row.original.doubles_wins}-${row.original.doubles_losses}`
      },
      {
        id: "doubles_pc",
        header: "Win %",
        cell: ({ row }) => `${percentage(row.original.doubles_wins, row.original.doubles_wins + row.original.doubles_losses)}%`
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
          :name="ICONS.tournament"
          class="align-middle size-5"
        />
        Players by Number of Finals Player
      </div>

      <tournaments-finalists-chart
        v-if="data.length"
        :finalists="data"
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
