<script setup lang="ts">
defineProps<{
  resetFilters: () => void
}>()
</script>

<template>
  <u-button
    label="Reset Filters"
    :icon="ICONS.noFilter"
    @click="resetFilters"
    block
  />
</template>
