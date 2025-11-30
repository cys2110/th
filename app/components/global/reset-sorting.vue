<script setup lang="ts">
defineProps<{
  resetSorting: () => void
}>()
</script>

<template>
  <u-button
    label="Reset Sorting"
    :icon="ICONS.sortAlpha"
    @click="resetSorting"
    block
  />
</template>
