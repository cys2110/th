<script setup lang="ts">
const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const entryUpdate = useTemplateRef("entryUpdate")
</script>

<template>
  <div class="flex flex-col gap-6 mt-6">
    <admin-event-entries-create
      v-model="selectedEvent"
      @created="entryUpdate?.fetchEntries()"
    />

    <admin-event-entries-update
      ref="entryUpdate"
      v-model="selectedEvent"
    />
  </div>
</template>
