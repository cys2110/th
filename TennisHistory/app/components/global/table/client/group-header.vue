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
    color="neutral"
    variant="ghost"
    :icon="column.getIsGrouped() ? ICONS.groupOff : ICONS.group"
    @click="() => column.toggleGrouping()"
  />
</template>
