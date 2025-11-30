<script setup lang="ts">
import { PlayersLink, UBadge, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

const { teams } = defineProps<{
  teams: {
    team1: H2HTeamType
    team2: H2HTeamType
  }
  matches: H2HMatchType[]
  status: string
}>()

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const columns: TableColumn<H2HMatchType>[] = [
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: {
            name: "event",
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name),
              year: row.original.year,
              edId: row.original.id,
              tour: row.original.tour
            }
          }
        },
        () => row.original.year
      )
  },
  {
    accessorKey: "winning_team",
    header: "Winner",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        (row.original.winning_team === "t1" ? teams.team1.players : teams.team2.players).map(p =>
          h(PlayersLink, { key: p.id, player: p as PersonType })
        )
      )
  },
  { accessorKey: "level", header: "Level", cell: ({ row }) => h(UBadge, { label: row.original.level, color: row.original.level }) },
  {
    accessorKey: "tournament.name",
    header: "Tournament",
    cell: ({ row }) =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: {
            name: "tournament",
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name)
            }
          }
        },
        () => row.original.tournament.name
      )
  },
  { accessorKey: "round", header: "Round" },
  { accessorKey: "surface.id", header: "Surface" },
  { id: "score", header: "Score" }
]

const handleSelect = async (e: Event, row: TableRow<H2HMatchType>) => {
  if (row.original.stats) {
    await navigateTo({
      name: "match",
      params: {
        id: row.original.tournament.id,
        name: kebabCase(row.original.tournament.name),
        year: row.original.year,
        edId: row.original.id,
        tour: row.original.tour,
        mid: row.original.match_no
      }
    })
  } else {
    toast.add({
      title: "No statistics available for this match",
      color: "error"
    })
  }
}
</script>

<template>
  <dashboard-subpanel
    title="Matches"
    :icon="ICONS.scores"
  >
    <u-table
      :data="matches"
      :columns
      :loading="status === 'pending'"
      sticky
      @select="handleSelect"
      :ui="{ tbody: '[&>tr]:cursor-pointer' }"
    >
      <template #loading>
        <u-icon
          :name="icons.loading"
          class="size-8"
        />
      </template>

      <template #empty>
        <empty
          :message="`No matches played between ${teams.team1.players.map(p => `${p.first_name} ${p.last_name}`).join(' / ')} and ${teams.team2.players
            .map(p => `${p.first_name} ${p.last_name}`)
            .join(' / ')}`"
          :icon="ICONS.noH2H"
          class="mx-2"
        />
      </template>

      <template #score-cell="{ row }">
        <div class="flex justify-center items-center">
          <div
            v-if="row.original.sets?.[0]?.length"
            class="flex items-center gap-1 mr-2"
          >
            <span
              v-for="(set, index) in row.original.sets[0]"
              :key="index"
            >
              {{ set[0] }}{{ row.original.sets[1]![index]![0]
              }}<sup v-if="isDefined(set[1]) && isDefined(row.original.sets[1]![index]![1])">{{
                set[1] < row.original.sets[1]![index]![1] ? set[1] : row.original.sets[1]![index]![1]
              }}</sup>
            </span>
          </div>
          <u-badge
            v-if="row.original.incomplete"
            :label="`${row.original.incomplete}.`"
            color="error"
          />
        </div>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
