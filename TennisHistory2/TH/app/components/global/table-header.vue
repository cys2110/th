<script setup lang="ts" generic="T">
import type { Column } from "@tanstack/vue-table"

const props = withDefaults(
  defineProps<{
    column: Column<T>
    filter?: boolean
    sort?: boolean
    label: string
    icon?: string | false
    type?: string
    multiple?: boolean
    query?: string
  }>(),
  {
    filter: false,
    sort: false,
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
    } else {
      return value
    }
  })
})

const isSorted = computed(() => props.column.getIsSorted())

const sortIcon = computed(() => {
  switch (get(isSorted)) {
    case "asc":
      return ICONS.sortAsc
    case "desc":
      return ICONS.sortDesc
    default:
      return ICONS.sort
  }
})

const handleSortClick = () => {
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

watch(
  () => route.query[props.query || props.label.toLowerCase()],
  () => {
    props.column.setFilterValue(route.query[props.query || props.label.toLowerCase()])
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex items-center gap-0.5 mx-auto w-fit">
    <u-select-menu
      v-if="filter"
      :placeholder="label"
      :model-value="<any>route.query[query || label.toLowerCase()]"
      @update:model-value="updateRouteQuery(query || label.toLowerCase(), $event)"
      variant="none"
      clear
      :items="sortedUniqueValues"
      :icon="icon ?? undefined"
      class="w-fit max-w-50"
      :value-key="type === 'name' ? 'value' : undefined"
      :label-key="type === 'name' ? 'label' : undefined"
      :multiple
    />

    <u-button
      v-if="sort"
      :label="!filter ? label : undefined"
      color="neutral"
      variant="ghost"
      :icon="!filter && icon ? icon : undefined"
      :trailing-icon="sortIcon"
      @click="handleSortClick"
      :ui="{ trailingIcon: 'size-5' }"
    />
  </div>
</template>
