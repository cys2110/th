<script setup lang="ts">
const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const infoUpdate = useTemplateRef("infoUpdate")
</script>

<template>
  <div class="flex flex-col gap-6 mt-6">
    <admin-event-info-create
      v-model="selectedEvent"
      @created="infoUpdate?.fetchInfo()"
    />

    <admin-event-info-update
      ref="infoUpdate"
      v-model="selectedEvent"
    />
  </div>
</template>
