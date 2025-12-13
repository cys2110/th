<script setup lang="ts">
import {
  TournamentsAge,
  TournamentsCountry,
  TournamentsFinalists,
  TournamentsLowestRank,
  TournamentsPm,
  TournamentsScoresStats,
  TournamentsSeeds,
  TournamentsStatuses
} from "#components"

const selection = defineModel<string>()

const component = computed(() => {
  switch (selection.value) {
    case "age":
      return TournamentsAge
    case "country":
      return TournamentsCountry
    case "finalists":
      return TournamentsFinalists
    case "games-sets-lost":
      return TournamentsScoresStats
    case "lowest-ranked":
      return TournamentsLowestRank
    case "pm":
      return TournamentsPm
    case "seeds":
      return TournamentsSeeds
    case "statuses":
      return TournamentsStatuses
    default:
      return null
  }
})
</script>

<template>
  <component :is="component" />
</template>
