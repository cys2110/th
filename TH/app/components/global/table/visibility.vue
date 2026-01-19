<script setup lang="ts">
import type { Table } from "@tanstack/vue-table"

const props = defineProps<{
  table: { tableApi: Table<any> } | null
}>()

const columns = computed(() =>
  props.table?.tableApi
    ?.getAllFlatColumns()
    .filter(column => column.getCanHide())
    .map(column => ({
      label: startCase(column.id),
      type: "checkbox" as const,
      checked: column.getIsVisible(),
      onUpdateChecked(checked: boolean) {
        props.table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
      },
      onSelect(e?: Event) {
        e?.preventDefault()
      }
    }))
)
</script>

<template>
  <u-dropdown-menu
    :items="columns"
    :content="{ align: 'end' }"
  >
    <u-button
      label="Hide Columns"
      block
      :icon="ICONS.columnOff"
    />
  </u-dropdown-menu>
</template>
