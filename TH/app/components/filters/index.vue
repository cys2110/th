<script setup lang="ts">
import type { Table } from "@tanstack/vue-table"

const props = defineProps<{
  resetFilters?: () => void
  showResetFilters: boolean
  table?: { tableApi: Table<any> } | null
}>()

const handleResetFilters = () => {
  if (props.resetFilters) {
    props.resetFilters()
  } else {
    props.table?.tableApi.resetColumnFilters()
    props.table?.tableApi.resetGlobalFilter()
  }
}
</script>

<template>
  <u-form-field label="Filter by">
    <div class="*:my-2">
      <slot />
    </div>

    <u-button
      v-if="showResetFilters"
      label="Reset Filters"
      block
      :icon="ICONS.filterOff"
      @click="handleResetFilters"
    />
  </u-form-field>
</template>
