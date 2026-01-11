<script setup lang="ts">
const {
  params: { id }
} = useRoute("tournament")
const tournamentStore = useTournamentStore()

const { data, status } = await useFetch("/api/tournament/lowest-ranked", {
  query: { id },
  default: () => []
})

const groupedData = computed<Record<RoundEnumType, TournamentLowestRankedType[]>>(
  () => groupBy(data.value, "round") as Record<RoundEnumType, TournamentLowestRankedType[]>
)
const rounds: RoundEnumType[] = ["Win", "Final", "Semifinals", "Quarterfinals"]
</script>

<template>
  <dashboard-subpanel
    title="Lowest Ranked Singles Players to Reach Later Rounds"
    :icon="ICONS.sortDesc"
  >
    <template #right>
      <tournament-numbers-lowest-rank-chart
        :events="data"
        :status
      />
    </template>

    <u-page-grid
      v-if="data.length || status === 'pending'"
      class="lg:grid-cols-2"
    >
      <tournament-numbers-lowest-rank-card
        v-if="data.length"
        v-for="round in rounds"
        :key="round"
        :round="groupedData[round]"
      />

      <loading-base
        v-else
        v-for="_ in 4"
        :key="_"
      />
    </u-page-grid>

    <empty
      v-else
      :message="`No editions have been played for ${tournamentStore.name}`"
      :icon="ICONS.calendarOff"
    />
  </dashboard-subpanel>
</template>
