<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

defineProps<{
  tournaments: TournamentType[]
  status: AsyncDataRequestStatus
}>()
</script>

<template>
  <u-page-grid v-if="tournaments.length || status === 'pending'">
    <tournaments-card
      v-if="tournaments.length"
      v-for="tournament in tournaments"
      :key="tournament.id.toString()"
      :tournament
    />

    <loading-card
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-grid>

  <empty
    v-else
    message="No tournaments found"
    :icon="ICONS.trophyOff"
  >
    <dev-only>
      <tournaments-update />
    </dev-only>
  </empty>
</template>
