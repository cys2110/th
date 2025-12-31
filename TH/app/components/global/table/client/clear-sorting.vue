<script setup lang="ts">
/**
 * @description Component to clear sorting on tanstack table where sorting is handled by tanstack table
 * @param table - the table ref containing the table API
 */

import type { Table } from "@tanstack/vue-table"

defineProps<{
  table: { tableApi: Table<any> } | null
}>()
</script>

<template>
  <u-button
    label="Clear Sorting"
    :icon="ICONS.sort"
    @click="() => table?.tableApi.resetSorting()"
    block
  />
</template>
