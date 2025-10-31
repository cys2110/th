<script setup lang="ts">
import { PlayerRecordTableGrouped, PlayerRecordTableUngrouped } from "#components"

const { results, status, tour, firstName, lastName } = defineProps<{
  results: RecordAPIType
  status: APIStatusType
  tour: TourType
  firstName?: string
  lastName?: string
}>()
const { tableMode } = useDefaultTable()
</script>

<template>
  <component
    :is="tableMode === 'grouped' ? PlayerRecordTableGrouped : PlayerRecordTableUngrouped"
    :key="tableMode"
    :results
    :status
    :tour
    :firstName
    :lastName
  />
</template>
