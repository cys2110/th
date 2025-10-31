<script setup lang="ts">
defineProps<{
  events: ActivityEventInterface[]
  status: APIStatusType
  tour: TourType
  matchType: MatchType
  year: string
  firstName?: string
  lastName?: string
}>()
const { icons } = useAppConfig()
</script>

<template>
  <u-page-list v-if="events.length || status === 'pending'">
    <player-activity-card
      v-if="events.length"
      v-for="event in events"
      :key="event.id"
      :event
      :year
      :tour
      :match-type
    />
    <loading-activity
      v-else
      v-for="_ in 3"
      :key="_"
    />
  </u-page-list>
  <error-message
    v-else
    :icon="icons.noCalendar"
    :message="`${firstName} ${lastName} had no ${matchType} activity in ${year}`"
  />
</template>
