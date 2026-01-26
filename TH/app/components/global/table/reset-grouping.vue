<script setup lang="ts">
defineEmits<{
  (e: "reset-grouping"): void
}>()
</script>

<template>
  <u-button
    label="Reset Grouping"
    block
    :icon="ICONS.groupOff"
    @click="$emit('reset-grouping')"
  />
</template>
