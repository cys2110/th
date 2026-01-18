<script setup lang="ts">
const props = defineProps<{
  groupingValue: string
  label?: string
}>()

const grouping = useRouteQuery<string | null>("grouping", null)

const handleGrouping = () => {
  if (grouping.value) {
    set(grouping, null)
  } else {
    set(grouping, props.groupingValue)
  }
}
</script>

<template>
  <u-button
    :label
    :icon="grouping === groupingValue ? ICONS.groupOff : ICONS.group"
    variant="ghost"
    color="neutral"
    @click="handleGrouping"
  />
</template>
