<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { type Column, getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"
import SortTableHeader from "~/components/sort-table-header.vue"

const { index, status } = defineProps<{
  index: WLIndexInterface[]
  status: APIStatusType
  first_name: string
  last_name: string
}>()
const {
  ui: { icons }
} = useAppConfig()

const columns: TableColumn<WLIndexInterface>[] = [
  { id: "expand" },
  { accessorKey: "category" },
  { accessorKey: "stat", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Stat", type: "alpha" }) },
  { accessorKey: "level", header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Level", type: "alpha" }) },
  {
    accessorKey: "wins",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Wins", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record" && row.depth !== 3) {
        return `Overall: ${index[0]?.wins}`
      } else if (row.getIsGrouped() && row.depth === 3) {
        return `Avg: ${Math.round(row.getValue("wins") as number)}`
      } else {
        return Math.round(row.getValue("wins"))
      }
    }
  },
  {
    accessorKey: "losses",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Losses", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record" && row.depth !== 3) {
        return `Overall: ${index[0]?.losses}`
      } else if (row.getIsGrouped() && row.depth === 3) {
        return `Avg: ${Math.round(row.getValue("losses") as number)}`
      } else {
        return Math.round(row.getValue("losses"))
      }
    }
  },
  {
    accessorKey: "value",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Value", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record") {
        return `Overall: ${index[0]?.value.toFixed(3)}`
      } else if (row.getIsGrouped()) {
        return `Avg: ${(row.getValue("value") as number).toFixed(3)}`
      } else {
        return (row.getValue("value") as number).toFixed(3)
      }
    }
  },
  {
    accessorKey: "titles",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "Titles", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record") {
        return `Overall: ${index[0]?.titles}`
      } else if (row.getIsGrouped() && row.original.category === "Environment") {
        return `Avg: ${Math.round(row.getValue("titles") as number)}`
      } else {
        return row.getValue("titles")
      }
    }
  },
  {
    accessorKey: "ytd_wins",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Wins", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record" && row.depth !== 3) {
        return `Overall: ${index[0]?.ytd_wins}`
      } else if (row.getIsGrouped() && row.depth === 3) {
        return `Avg: ${Math.round(row.getValue("ytd_wins") as number)}`
      } else {
        return Math.round(row.getValue("ytd_wins"))
      }
    }
  },
  {
    accessorKey: "ytd_losses",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Losses", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record" && row.depth !== 3) {
        return `Overall: ${index[0]?.ytd_losses}`
      } else if (row.getIsGrouped() && row.depth === 3) {
        return `Avg: ${Math.round(row.getValue("ytd_losses") as number)}`
      } else {
        return Math.round(row.getValue("ytd_losses"))
      }
    }
  },
  {
    accessorKey: "ytd_value",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Value", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record") {
        return `Overall: ${index[0]?.ytd_value.toFixed(3)}`
      } else if (row.getIsGrouped()) {
        return `Avg: ${(row.getValue("ytd_value") as number).toFixed(3)}`
      } else {
        return (row.getValue("ytd_value") as number).toFixed(3)
      }
    }
  },
  {
    accessorKey: "ytd_titles",
    header: ({ column }) => h(SortTableHeader, { column: column as Column<unknown>, label: "YTD Titles", type: "number" }),
    aggregationFn: "mean",
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.original.category === "Match Record") {
        return `Overall: ${index[0]?.ytd_titles}`
      } else if (row.getIsGrouped() && row.original.category === "Environment") {
        return `Avg: ${Math.round(row.getValue("ytd_titles") as number) ?? undefined}`
      } else {
        return row.getValue("ytd_titles")
      }
    }
  }
]

const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: "remove",
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <u-table
    :data="index"
    :columns
    sticky
    :loading="status === 'pending'"
    :grouping="['category', 'stat']"
    :grouping-options="grouping_options"
    :empty="`No win-loss index available for ${first_name} ${last_name}`"
    :ui="{
      root: 'scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent',
      td: 'empty:p-0' // helps with the colspaned row added for expand slot
    }"
  >
    <template #expand-cell="{ row }">
      <div
        v-if="row.getIsGrouped()"
        class="flex items-center"
      >
        <span
          class="inline-block"
          :style="{ width: `calc(${row.depth} * 1rem)` }"
        />

        <u-button
          variant="link"
          color="neutral"
          class="mr-2"
          size="xs"
          :icon="icons.chevronDoubleRight"
          :ui="{ leadingIcon: row.getIsExpanded() ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200' }"
          @click="row.toggleExpanded()"
        />

        <div
          v-if="row.groupingColumnId === 'category'"
          class="font-semibold"
        >
          {{ row.original.category }}
        </div>
        <div
          v-else-if="row.groupingColumnId === 'stat'"
          class="font-semibold"
        >
          {{ row.original.stat }}
        </div>
      </div>
    </template>
    <template #level-cell="{ row }">
      <u-badge
        v-if="!row.getIsGrouped()"
        :color="row.original.level.toLowerCase() as 'tour' | 'challenger' | 'itf'"
        :label="row.original.level"
      />
    </template>
  </u-table>
</template>
