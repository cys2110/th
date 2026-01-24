<script setup lang="ts" generic="T">
import type { Column } from "@tanstack/vue-table"

const props = withDefaults(
  defineProps<{
    column: Column<T>
    label: string
    icon?: string
  }>(),
  {
    icon: "line-md:filter-twotone"
  }
)

const sortedUniqueValues = computed(() => {
  const uniqueValues = useArrayUnique(Array.from(props.column.getFacetedUniqueValues().keys()).filter(Boolean).flat()).value.sort()

  return uniqueValues
})

const modelValue = computed({
  get: () => props.column.getFilterValue() as string[],
  set: (values: string[]) => props.column.setFilterValue(values)
})
</script>

<template>
  <u-input-menu
    :placeholder="label"
    variant="none"
    clear
    :items="sortedUniqueValues"
    v-model="modelValue"
    :icon
  />
</template>
