<script setup lang="ts">


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
