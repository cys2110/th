<script setup lang="ts">
/**
 * @description Component to clear grouping on tanstack table where grouping is handled by tanstack table
 * @prop table - the table ref containing the table API
 */

import type { Table } from "@tanstack/vue-table"

defineProps<{
  table: { tableApi: Table<any> } | null
}>()
</script>

<template>
  <u-button
    label="Clear Grouping"
    :icon="ICONS.groupOff"
    @click="() => table?.tableApi.resetGrouping()"
    block
  />
</template>
