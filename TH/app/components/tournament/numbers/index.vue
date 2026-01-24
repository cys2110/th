<script setup lang="ts">
import {
  TournamentNumbersAge,
  TournamentNumbersCountry,
  TournamentNumbersFinalists,
  TournamentNumbersLowestRank,
  TournamentNumbersPm,
  TournamentNumbersScoresStats,
  TournamentNumbersSeeds,
  TournamentNumbersStatuses
} from "#components"

const props = defineProps<{
  selection: string
}>()

const component = computed(() => {
  switch (props.selection) {
    case "age":
      return TournamentNumbersAge
    case "country":
      return TournamentNumbersCountry
    case "finalists":
      return TournamentNumbersFinalists
    case "games-sets-lost":
      return TournamentNumbersScoresStats
    case "lowest-ranked":
      return TournamentNumbersLowestRank
    case "pm":
      return TournamentNumbersPm
    case "seeds":
      return TournamentNumbersSeeds
    case "statuses":
      return TournamentNumbersStatuses
    default:
      return null
  }
})
</script>

<template>
  <component :is="component" />
</template>
