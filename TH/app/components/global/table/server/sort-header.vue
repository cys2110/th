<script setup lang="ts">
/**
 * Header component for sortable table columns where tanstack/vue-table handles the sorting logic.
 * @prop label - Optional label for the sort header.
 * @prop sortKey - The key to sort by when this header is clicked.
 * @model modelValue - Two-way bound model for the sort values.
 */

const props = defineProps<{
  label?: string
  sortKey: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: SortFieldType[] | undefined): void
}>()

const sortField = defineModel<SortFieldType[]>()

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

  if (!sortEntry.value) {
    sortField.value.push({ field: props.sortKey, direction: "ASC" as "ASC" })
  } else if (sortEntry.value === "ASC") {
    const index = sortField.value.findIndex(entry => entry.field === props.sortKey)
    const newEntry: { field: string; direction: "ASC" | "DESC" } = { field: props.sortKey, direction: "DESC" }
    if (index !== -1 && index !== undefined) {
      sortField.value[index] = newEntry
    } else {
      sortField.value.push(newEntry)
    }
  } else {
    sortField.value = sortField.value.filter(entry => entry.field !== props.sortKey)
  }
  emit("update:modelValue", sortField.value.length ? sortField.value : undefined)
}
</script>

<template>
  <u-button
    :label="label"
    :icon="icon"
    variant="ghost"
    color="neutral"
    @click="handleClick"
  />
</template>
