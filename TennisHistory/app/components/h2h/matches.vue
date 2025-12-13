<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const { teams } = defineProps<{
  teams: {
    team1: H2HTeamType
    team2: H2HTeamType
  }
  matches: H2HMatchType[]
  status: string
}>()

const toast = useToast()

const handleSelect = async (e: Event, row: TableRow<H2HMatchType>) => {
  if (row.original.stats) {
    const draw = row.original.round.includes("Qualifying") || row.original.round === "Qualifier" ? "Qualifying" : "Main"
    const type = teams.team1.players.length > 1 ? "Doubles" : "Singles"

    await navigateTo({
      name: "match",
      params: {
        id: row.original.tournament.id,
        name: kebabCase(row.original.tournament.name),
        year: row.original.year,
        edId: row.original.id
      },
      query: {
        tour: row.original.tour,
        draw,
        type,
        match_no: row.original.match_no
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
      :columns="h2hMatchesColumns(teams)"
      :loading="status === 'pending'"
      sticky
      @select="handleSelect"
      :ui="{ tbody: '[&>tr]:cursor-pointer' }"
    >
      <template #loading>
        <loading-icon />
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
    </u-table>
  </dashboard-subpanel>
</template>
