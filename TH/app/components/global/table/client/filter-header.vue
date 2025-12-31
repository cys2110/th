<script setup lang="ts" generic="T">
/**
 * @description Header component for filterable table columns where tanstack/vue-table handles the filtering logic.
 * @param column - The column object from tanstack/vue-table.
 * @param label - Label for the filter header.
 */

import type { Column } from "@tanstack/vue-table"

const props = defineProps<{
  column: Column<T>
  label: string
}>()

const sortedUniqueValues = computed(() => {
  const uniqueValues = Array.from(props.column.getFacetedUniqueValues().keys())

  return uniqueValues.sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") {
      return a - b
    }
    return String(a).localeCompare(String(b))
  })
})

const modelValue = computed({
  get: () => props.column.getFilterValue() as string[],
  set: (values: string[]) => props.column.setFilterValue(values)
})
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    :placeholder="label"
    :items="sortedUniqueValues"
    variant="none"
    :icon="ICONS.filter"
  />
</template>
