<script setup lang="ts">
/**
 * @description Component to clear filters on tanstack table where filtering is handled by tanstack table
 * @param table - the table ref containing the table API
 */

import type { Table } from "@tanstack/vue-table"

defineProps<{
  table: { tableApi: Table<any> } | null
}>()
</script>

<template>
  <u-button
    label="Clear Filters"
    :icon="ICONS.filterOff"
    @click="() => table?.tableApi.resetColumnFilters()"
    block
  />
</template>
