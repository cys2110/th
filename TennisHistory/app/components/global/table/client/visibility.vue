<script setup lang="ts">
import type { Table } from "@tanstack/vue-table"

defineProps<{
  table: { tableApi: Table<any> } | null
}>()
</script>

<template>
  <u-dropdown-menu
    v-if="table"
    :items="
      table?.tableApi
        ?.getAllFlatColumns()
        .filter((column) => column.getCanHide())
        .map((column) => ({
          label: startCase(column.id),
          type: 'checkbox' as const,
          checked: column.getIsVisible(),
          onUpdateChecked(checked: boolean) {
            table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
          },
          onSelect(e?: Event) {
            e?.preventDefault()
          }
        }))
    "
    :content="{ align: 'end' }"
  >
    <u-button
      label="Hide Columns"
      :icon="ICONS.columnOff"
      block
    />
  </u-dropdown-menu>
</template>
