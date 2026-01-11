<script setup lang="ts" generic="T">


import type { Column } from "@tanstack/vue-table"

defineProps<{
  column: Column<T>
  label?: string
}>()
</script>

<template>
  <u-button
    :label="label"
    :icon="column.getIsGrouped() ? ICONS.groupOff : ICONS.group"
    variant="ghost"
    color="neutral"
    @click="() => column.toggleGrouping()"
  />
</template>
