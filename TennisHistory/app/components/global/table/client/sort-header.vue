<script setup lang="ts" generic="T">


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
    :trailing-icon="icon"
    variant="ghost"
    color="neutral"
    @click="handleClick"
  />
</template>
