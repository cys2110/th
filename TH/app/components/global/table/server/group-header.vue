<script setup lang="ts">
/**
 * @description Header component for grouping table columns where server-side logic handles the grouping.
 * @param groupingValue - The current grouping value.
 * @param label - Optional label for the grouping header.
 */

const props = defineProps<{
  groupingValue: string
  label?: string
}>()

const columnGrouping = defineModel<string[]>()

const handleGrouping = () => {
  const grouping = get(columnGrouping) || []

  if (grouping.includes(props.groupingValue)) {
    set(
      columnGrouping,
      grouping.filter(g => g !== props.groupingValue)
    )
  } else {
    set(columnGrouping, [...grouping, props.groupingValue])
  }
}
</script>

<template>
  <u-button
    :label="label"
    :icon="columnGrouping?.includes(groupingValue) ? ICONS.groupOff : ICONS.group"
    variant="ghost"
    color="neutral"
    @click="handleGrouping"
  />
</template>
