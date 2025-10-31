<script setup lang="ts">
const {
  params: { id, name }
} = useRoute("tournament")
const {
  icons,
  ui: { icons: uIcons }
} = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: players, status } = await useFetch<EntryInterface[]>("/api/tournaments/statuses", {
  key: `tournament-statuses-${id}`,
  query: { id },
  default: () => [],
  server: false
})
</script>

<template>
  <u-page-grid
    v-if="players.length || ['idle', 'pending'].includes(status)"
    class="lg:grid-cols-2"
  >
    <u-card
      v-if="players.length"
      v-for="(team, index) in players"
      :key="index"
      :ui="{
        root: `ring-${getTourColour([team.tour])}`,
        header: 'flex items-center justify-between',
        footer: 'mx-auto w-fit'
      }"
    >
      <template #header>
        <player-link
          v-for="player in team.players"
          :key="player.id + index"
          :player
          class="font-semibold"
        />

        <u-link
          :to="{ name: 'event', params: { id, name, year: team.year, eid: team.eid } }"
          class="hover-link default-link font-semibold"
        >
          {{ team.year }}
        </u-link>
      </template>

      <div class="flex items-center gap-2 justify-center">
        <u-badge
          :label="team.tour"
          :color="getTourColour([team.tour])"
        />
        <u-badge
          :label="team.type"
          :color="team.type === 'Singles' ? 'singles' : 'doubles'"
        />
        <u-badge
          :label="STATUSES[team.status].longName"
          color="primary"
        />
      </div>
    </u-card>

    <loading-player
      v-else
      v-for="_ in 4"
      :key="_"
    />
  </u-page-grid>
  <error-message
    v-else
    :icon="icons.noTournament"
    :message="`No qualifiers, lucky losers, alternates or wild cards have won ${tournamentName}`"
  />
</template>
