<script setup lang="ts">
const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const seedsUpdate = useTemplateRef("seedsUpdate")
</script>

<template>
  <div class="flex flex-col gap-6 mt-6">
    <admin-event-seeds-create
      v-model="selectedEvent"
      @created="seedsUpdate?.fetchSeeds()"
    />

    <admin-event-seeds-update
      ref="seedsUpdate"
      v-model="selectedEvent"
    />
  </div>
</template>
