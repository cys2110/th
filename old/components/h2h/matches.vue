<script setup lang="ts">
import { MatchScoreItem, PlayerLink, TableHeaderFilter, TableHeaderName, TableHeaderSort, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type Column } from "@tanstack/vue-table"

const { h2h } = defineProps<{ h2h: { p1: PlayerInterface; p2: PlayerInterface; p1Wins: number; p2Wins: number } }>()

const {
  params: { p1Id, p2Id }
} = useRoute("head-to-head")
const {
  ui: { icons }
} = useAppConfig()

interface APIResponse extends EventInterface {
  match: MatchInterface
}

const { data: events, status } = await useFetch<APIResponse[]>("/api/h2h/matches", {
  query: { p1Id, p2Id },
  default: () => [],
  server: false
})

const columns: TableColumn<APIResponse>[] = [
  {
    accessorKey: "year",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Year", type: "number" }),
    cell: ({ row }) =>
      h(
        ULink,
        {
          to: {
            name: "event",
            params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name), year: row.original.year, eid: row.original.id }
          },
          class: "hover-link default-link w-fit mx-auto"
        },
        () => row.original.year
      )
  },
  {
    id: "winner",
    accessorFn: row => `${row.match.winner.last_name}, ${row.match.winner.first_name}`,
    filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Winner" }),
    cell: ({ row }) =>
      h(PlayerLink, {
        player: row.original.match.winner,
        centred: true
      })
  },
  {
    accessorKey: "tournament.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Tournament" }),
    cell: ({ row }) =>
      h(
        ULink,
        {
          to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } },
          class: "hover-link default-link w-fit mx-auto"
        },
        () => row.original.tournament.name
      )
  },
  {
    accessorKey: "match.round",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Round" })
  },
  {
    accessorKey: "surface.id",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Surface" })
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) =>
      h(MatchScoreItem, {
        draw: row.original.match.draw,
        tour: h2h.p1.tour,
        type: "Singles",
        sets: row.original.match.sets,
        tournament: row.original.tournament,
        id: row.original.id,
        year: row.original.year,
        match_no: row.original.match.match_no,
        incomplete: row.original.match.incomplete,
        centred: true,
        stats: row.original.match.stats
      })
  }
]
</script>

<template>
  <dashboard-subpanel
    title="Matches"
    :icon="ICONS.upcoming"
  >
    <u-table
      :data="events"
      :columns
      :loading="['idle', 'pending'].includes(status)"
      sticky
    >
      <template #loading>
        <u-icon
          :name="icons.loading"
          class="size-8"
        />
      </template>

      <template #empty>
        <div class="flex justify-center items-center w-full gap-2 text-error">
          <u-icon
            :name="ICONS.noH2H"
            class="text-base"
          />
          No matches found between {{ h2h.p1.first_name }} {{ h2h.p1.last_name }} and {{ h2h.p2.first_name }} {{ h2h.p2.last_name }}.
        </div>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
