<script setup lang="ts">
const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const roundsUpdate = useTemplateRef("roundsUpdate")
</script>

<template>
  <div class="flex flex-col gap-6 mt-6">
    <admin-event-rounds-create
      v-model="selectedEvent"
      @created="roundsUpdate?.fetchRounds()"
    />

    <admin-event-rounds-update
      ref="roundsUpdate"
      v-model="selectedEvent"
    />
  </div>
</template>
