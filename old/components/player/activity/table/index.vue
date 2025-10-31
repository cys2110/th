<script setup lang="ts">
import { PlayerActivityTableGrouped, PlayerActivityTableUngrouped } from "#components"

const { events } = defineProps<{
  events: ActivityEventInterface[]
  status: APIStatusType
  tour: TourType
  matchType: MatchType
  year: string
  firstName?: string
  lastName?: string
}>()
const { tableMode } = useDefaultTable()

const flattenedEvents = computed(() => {
  const newEvents: (EventInterface & MatchInterface)[] = []
  events.forEach(event => {
    event.matches.forEach(match => {
      // @ts-expect-error
      newEvents.push({
        ...event,
        ...match
      })
    })
  })
  return newEvents
})
</script>

<template>
  <component
    :is="tableMode === 'grouped' ? PlayerActivityTableGrouped : PlayerActivityTableUngrouped"
    :key="tableMode"
    :events="flattenedEvents"
    :status
    :tour
    :match-type
    :year
    :first-name
    :last-name
  />
</template>
