<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { type Column } from "@tanstack/vue-table"
import SortTableHeader from "~/components/sort-table-header.vue"

const { index, status } = defineProps<{
  index: WLIndexInterface[]
  status: APIStatusType
  first_name: string
  last_name: string
}>()

const columns: TableColumn<WLIndexInterface>[] = [
  {
    accessorKey: "category",
    header: ({ column }) =>
      h(SortTableHeader, {
        column: column as Column<unknown>,
        label: "Category",
        type: "alpha"
      })
  },
  { accessorKey: "stat", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Stat", type: "alpha" }) },
  { accessorKey: "level", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Level", type: "alpha" }) },
  { accessorKey: "wins", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Wins", type: "number" }) },
  { accessorKey: "losses", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Losses", type: "number" }) },
  {
    accessorKey: "value",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Value", type: "number" }),
    cell: ({ row }) => row.original.value.toFixed(3)
  },
  { accessorKey: "titles", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Titles", type: "number" }) },
  { accessorKey: "ytd_wins", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Wins", type: "number" }) },
  {
    accessorKey: "ytd_losses",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Losses", type: "number" })
  },
  {
    accessorKey: "ytd_value",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Value", type: "number" }),
    cell: ({ row }) => row.original.ytd_value.toFixed(3)
  },
  {
    accessorKey: "ytd_titles",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Titles", type: "number" })
  }
]
</script>

<template>
  <u-table
    :data="index"
    :columns
    sticky
    :loading="status === 'pending'"
    :empty="`No win-loss index available for ${first_name} ${last_name}`"
    class="scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent"
  >
    <template #level-cell="{ row }">
      <u-badge
        :color="row.original.level.toLowerCase() as 'tour' | 'challenger' | 'itf'"
        :label="row.original.level"
      />
    </template>
  </u-table>
</template>
