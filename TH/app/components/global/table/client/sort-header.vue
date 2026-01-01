<script setup lang="ts" generic="T">
/**
 * Header component for sortable table columns where tanstack/vue-table handles the sorting logic.
 * @prop column - The column object from tanstack/vue-table.
 * @prop label - Optional label for the sort header.
 * @model modelValue - Two-way bound model for the filter values.
 */

import type { Column } from "@tanstack/vue-table"

const props = defineProps<{
  column: Column<T>
  label?: string
}>()

const isSorted = computed(() => props.column.getIsSorted())

const icon = computed(() => {
  switch (get(isSorted)) {
    case "asc":
      return ICONS.sortAsc
    case "desc":
      return ICONS.sortDesc
    default:
      return ICONS.sort
  }
})

const handleClick = () => {
  switch (get(isSorted)) {
    case "desc":
      props.column.clearSorting()
      break
    case "asc":
      props.column.toggleSorting(true, true)
      break
    default:
      props.column.toggleSorting(false, true)
      break
  }
}
</script>

<template>
  <u-button
    :label="label"
    :icon="icon"
    variant="ghost"
    color="neutral"
    @click="handleClick"
  />
</template>
