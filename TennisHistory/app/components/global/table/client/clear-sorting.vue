<script setup lang="ts">
import type { Table } from "@tanstack/vue-table"

defineProps<{
  table: { tableApi: Table<any> } | null
}>()
</script>

<template>
  <u-button
    label="Reset Sorting"
    :icon="ICONS.sort"
    @click="() => table?.tableApi.resetSorting()"
    block
  />
</template>
