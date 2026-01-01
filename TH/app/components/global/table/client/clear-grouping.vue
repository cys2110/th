<script setup lang="ts">


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
