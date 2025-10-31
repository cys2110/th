<script setup lang="ts">
import { PlayerActivityTableGroupedDoubles, PlayerActivityTableGroupedSingles } from "#components"

defineProps<{
  events: (EventInterface & MatchInterface)[]
  status: APIStatusType
  tour: TourType
  matchType: MatchType
  year: string
  firstName?: string
  lastName?: string
}>()
</script>

<template>
  <component
    :is="matchType === 'Singles' ? PlayerActivityTableGroupedSingles : PlayerActivityTableGroupedDoubles"
    :key="matchType"
    :events
    :status
    :tour
    :year
    :first-name
    :last-name
  />
</template>
