<script setup lang="ts">
import type { Table } from "@tanstack/vue-table"

const props = defineProps<{
  resetGrouping?: () => void
  table?: { tableApi: Table<any> }
}>()

const handleResetGrouping = () => {
  if (props.resetGrouping) {
    props.resetGrouping()
  } else {
    props.table?.tableApi.resetGrouping()
  }
}
</script>

<template>
  <u-button
    label="Reset Grouping"
    block
    :icon="ICONS.groupOff"
    @click="handleResetGrouping"
  />
</template>
