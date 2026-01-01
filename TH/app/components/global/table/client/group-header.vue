<script setup lang="ts" generic="T">
/**
 * Header component for grouping table columns where tanstack/vue-table handles the grouping logic.
 * @prop column - The column object from tanstack/vue-table.
 * @prop label - Optional label for the grouping header.
 */

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
