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
    query?: string
  }>(),
  {
    icon: ICONS.filter,
    type: "default",
    multiple: false
  }
)

const route = useRoute()

const updateRouteQuery = useRouteQueryUpdater()

const sortedUniqueValues = computed(() => {
  const uniqueAndSortedValues = useArrayUnique(Array.from(props.column.getFacetedUniqueValues().keys()).filter(Boolean).flat()).value.sort()

  return uniqueAndSortedValues.map((value, index) => {
    if (props.type === "name") {
      const [last_name, first_name] = value.split(", ")

      return {
        value,
        label: `${first_name} ${last_name}`
      }
    } else if (props.mapping) {
      return {
        value,
        label: props.mapping[value.toString()]
      }
    } else {
      return value
    }
  })
})

watch(
  () => route.query[props.query || props.label.toLowerCase()],
  () => {
    props.column.setFilterValue(route.query[props.query || props.label.toLowerCase()])
  },
  { immediate: true }
)
</script>

<template>
  <u-select-menu
    :placeholder="label"
    :model-value="<any>route.query[query || label.toLowerCase()]"
    @update:model-value="updateRouteQuery(query || label.toLowerCase(), $event)"
    variant="none"
    clear
    :items="sortedUniqueValues"
    :icon
    class="w-fit max-w-50"
    :value-key="type === 'name' || mapping ? 'value' : undefined"
    :label-key="type === 'name' || mapping ? 'label' : undefined"
    :multiple
  />
</template>
