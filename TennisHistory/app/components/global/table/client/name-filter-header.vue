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
  const uniqueValues = Array.from(props.column.getFacetedUniqueValues().keys()).filter(Boolean).sort()

  return uniqueValues.map(value => {
    if (value.includes(" / ")) {
      const names = value
        .split(" / ")
        .map((playerName: string) => {
          const [last_name, first_name] = playerName.split(", ")
          return `${first_name} ${last_name}`
        })
        .join(" / ")

      return {
        value,
        label: names
      }
    }
    const [last_name, first_name] = value.split(", ")

    return {
      value,
      label: `${first_name} ${last_name}`
    }
  })
})

const modelValue = computed({
  get: () => props.column.getFilterValue() as string[],
  set: (values: { value: string; label: string }[]) => props.column.setFilterValue(values)
})
</script>

<template>
  <u-select-menu
    :placeholder="label"
    variant="none"
    clear
    value-key="value"
    label-key="label"
    :items="sortedUniqueValues"
    v-model="modelValue"
    multiple
    :icon
  />
</template>
