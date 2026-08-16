<script setup lang="ts">
const route = useRoute("tournament")

const tournamentType = computed(() => getTournamentType(route.params.name as string))
</script>

<template>
  <tournament-country-winners v-if="tournamentType === 'country'" />

  <tournament-laver-winners v-else-if="tournamentType === 'laver'" />

  <tournament-elimination-winners v-else />
</template>
