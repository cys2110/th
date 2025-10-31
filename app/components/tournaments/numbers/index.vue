<script setup lang="ts">
defineProps<{ tournament: TournamentInterface }>()
const { viewMode } = useViewMode()
const selectedTab = defineModel<string>()
</script>

<template>
  <tournaments-numbers-cards
    v-if="viewMode === 'cards'"
    :tournament
    v-model="selectedTab"
  />

  <tournaments-numbers-table
    v-else
    :tournament
    v-model="selectedTab"
  />
</template>
