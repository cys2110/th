<script setup lang="ts">
defineEmits(["reset-grouping"])
</script>

<template>
  <u-button
    label="Reset Grouping"
    block
    :icon="ICONS.groupOff"
    @click="$emit('reset-grouping')"
  />
</template>
