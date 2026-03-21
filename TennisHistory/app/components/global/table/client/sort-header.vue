<script setup lang="ts" generic="T">
import type { Column } from "@tanstack/vue-table"

const props = defineProps<{
  column: Column<T>
  label?: string
  icon?: string
}>()

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
    :label
    color="neutral"
    variant="ghost"
    :icon
    :trailing-icon="sortIcon"
    @click="handleClick"
    :ui="{ trailingIcon: 'size-5' }"
  />
</template>
