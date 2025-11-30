<script setup lang="ts" generic="T">
import type { Table } from "@tanstack/vue-table"

defineProps<{ table: { tableApi: Table<T> } }>()
</script>

<template>
  <u-dropdown-menu
    :items="
          table?.tableApi
            ?.getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => ({
              label: capitalCase(column.id),
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
      :icon="ICONS.noColumn"
      block
    />
  </u-dropdown-menu>
</template>
