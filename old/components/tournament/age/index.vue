<script setup lang="ts">
const {
  params: { id }
} = useRoute("tournament")
const { icons } = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: winners, status } = await useFetch<TournamentAgeType[]>("/api/tournaments/winners-by-age", {
  key: `tournament-age-${id}`,
  query: { id },
  default: () => [],
  server: false
})
</script>

<template>
  <client-only>
    <teleport to="#dashboard-right">
      <tournament-age-chart
        v-if="mdAndUp && winners.length"
        :winners
      />
    </teleport>
  </client-only>
  <u-page-grid
    v-if="winners.length || ['idle', 'pending'].includes(status)"
    class="lg:grid-cols-2"
  >
    <template
      v-if="winners.length"
      v-for="winner in winners"
      :key="winner.id"
    >
      <u-card
        v-if="winner.age"
        :ui="{ root: `ring-${getTourColour(winner.player.tour)}`, body: 'text-center' }"
      >
        <template #header>
          <div class="flex justify-between items-center font-semibold">
            <player-link :player="winner.player" />
            <div class="flex items-center gap-1">
              <u-badge
                :label="winner.player.tour"
                :color="getTourColour([winner.player.tour])"
              />

              <u-badge
                :label="winner.type"
                :color="getMatchTypeColour(winner.type)"
              />
            </div>
          </div>
        </template>

        {{ getAge(winner.age) }}
      </u-card>
    </template>

    <loading-base
      v-else
      v-for="_ in 10"
      :key="_"
    />
  </u-page-grid>
  <error-message
    v-else
    :icon="icons.noCalendar"
    :message="`No winners found for ${tournamentName}`"
  />
</template>
