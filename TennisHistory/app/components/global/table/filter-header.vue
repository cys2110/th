<script setup lang="ts" generic="T">
import type { Column } from "@tanstack/vue-table"

const props = withDefaults(
  defineProps<{
    column: Column<T>
    label: string
    icon?: string
    mapping?: Record<any, any>
    type?: string
    multiple?: boolean
  }>(),
  {
    icon: ICONS.filter,
    type: "default",
    multiple: false
  }
)

const sortedUniqueValues = computed(() => {
  const uniqueAndSortedValues = useArrayUnique(Array.from(props.column.getFacetedUniqueValues().keys()).filter(Boolean).flat()).value.sort()

  // if (props.mapping) {
  //   uniqueValues.forEach((value, index) => (uniqueValues[index] = { value, label: props.mapping![value] }))
  // }

  return uniqueAndSortedValues.map((value, index) => {
    if (props.type === "name") {
      const [last_name, first_name] = value.split(", ")

      return {
        value,
        label: `${first_name} ${last_name}`
      }
    } else {
      return value
    }
  })
})

const modelValue = computed({
  get: () => props.column.getFilterValue() as string[],
  set: (values: string[]) => props.column.setFilterValue(values)
})
</script>

<template>
  <u-select-menu
    :placeholder="label"
    variant="none"
    clear
    :items="sortedUniqueValues"
    v-model="modelValue"
    :icon
    class="w-fit"
    :value-key="type === 'name' ? 'value' : undefined"
    :label-key="type === 'name' ? 'label' : undefined"
    :multiple
  />
</template>
