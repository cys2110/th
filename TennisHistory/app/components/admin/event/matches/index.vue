<script setup lang="ts">
const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const matchUpdate = useTemplateRef("matchesUpdate")
</script>

<template>
  <div class="flex flex-col gap-6 mt-6">
    <admin-event-matches-create
      v-model="selectedEvent"
      @created="matchUpdate?.fetchMatches()"
    />

    <admin-event-matches-update
      ref="matchesUpdate"
      v-model="selectedEvent"
    />
  </div>
</template>
