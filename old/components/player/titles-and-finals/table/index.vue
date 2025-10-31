<script setup lang="ts">
const { events, status, selection, tour, firstName, lastName } = defineProps<{
  events: TitlesAndFinalsInterface[]
  status: APIStatusType
  tour: TourType
  firstName: string
  lastName: string
  selection: ("Titles" | "Finals")[]
}>()
const { tableMode } = useDefaultTable()
</script>

<template>
  <player-titles-and-finals-table-grouped
    v-if="tableMode === 'grouped'"
    :events
    :status
    :tour
    :firstName
    :lastName
    :selection
  />

  <player-titles-and-finals-table-ungrouped
    v-else
    :events
    :status
    :tour
    :firstName
    :lastName
    :selection
  />
</template>
