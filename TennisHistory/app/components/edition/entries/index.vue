<script setup lang="ts">
const viewType = ref("Players")
</script>

<template>
  <div class="flex justify-end mb-4">
    <u-radio-group
      v-model="viewType"
      :items="['Players', 'Teams']"
      orientation="horizontal"
    />
  </div>

  <edition-entries-players v-if="viewType === 'Players'" />

  <edition-entries-teams v-else />
</template>
