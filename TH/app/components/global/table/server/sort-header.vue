<script setup lang="ts">
const props = defineProps<{
  label?: string
  sortKey: string
}>()

const sortField = useRouteQuery("sorting", null, {
  transform: {
    get: parseSort,
    set: serialiseSort
  }
})

const sortEntry = computed(() => sortField.value?.find(entry => entry.field === props.sortKey)?.direction)

const icon = computed(() => {
  if (!sortEntry.value) {
    return ICONS.sort
  } else if (sortEntry.value === "ASC") {
    return ICONS.sortAsc
  } else {
    return ICONS.sortDesc
  }
})

const handleClick = () => {
  if (!sortField.value) return

  let newSortField: SortFieldType[] = [...sortField.value]

  if (!sortEntry.value) {
    newSortField.push({ field: props.sortKey, direction: "ASC" })
  } else if (sortEntry.value === "ASC") {
    const index = sortField.value.findIndex(entry => entry.field === props.sortKey)
    const newEntry: { field: string; direction: "ASC" | "DESC" } = { field: props.sortKey, direction: "DESC" }
    if (index !== -1 && index !== undefined) {
      newSortField[index] = newEntry
    } else {
      newSortField.push(newEntry)
    }
  } else {
    newSortField = newSortField.filter(entry => entry.field !== props.sortKey)
  }
  set(sortField, newSortField.length ? newSortField : null)
}
</script>

<template>
  <u-button
    :label
    color="neutral"
    variant="ghost"
    :icon
    @click="handleClick"
  />
</template>
