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
  const uniqueValues = Array.from(props.column.getFacetedUniqueValues().keys()).sort()

  return uniqueValues.map(value => {
    const nameArray = value.split(", ")

    return {
      value,
      label: `${nameArray[1]} ${nameArray[0]}`
    }
  })
})

const modelValue = computed({
  get: () => props.column.getFilterValue() as string[],
  set: (values: { value: string; label: string }[]) => props.column.setFilterValue(values.map(v => v.value))
})
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    value-key="value"
    label-key="label"
    :placeholder="label"
    :items="sortedUniqueValues"
    variant="none"
    :icon="ICONS.filter"
  />
</template>
