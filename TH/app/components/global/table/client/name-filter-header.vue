<script setup lang="ts" generic="T">
import type { Column } from "@tanstack/vue-table"

const props = defineProps<{
  column: Column<T>
  label: string
}>()

const sortedUniqueValues = computed(() => {
  const uniqueValues = Array.from(props.column.getFacetedUniqueValues().keys()).sort()

  return uniqueValues.map(value => {
    const [last_name, first_name] = value.split(", ")

    return {
      value,
      label: `${first_name} ${last_name}`
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
