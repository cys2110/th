<script setup lang="ts">
import { TableCellGroup, TableHeaderGroup, TableHeaderSort } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import {
  type Column,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"
import ColouredBadge from "~/components/coloured-badge.vue"

definePageMeta({ name: "wl-index" })
const {
  params: { id }
} = useRoute("wl-index")
const {
  ui: { icons }
} = useAppConfig()
const playerName = useState<string>("player-name")

// API call
const { data, status } = await useFetch<WLIndexInterface[]>("/api/players/wl-index", {
  key: `wl-index-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columns = computed<TableColumn<WLIndexInterface>[]>(() => [
  {
    accessorKey: "category",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Category" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "category" }, () => row.original.category)
  },
  {
    accessorKey: "stat",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Stat" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "stat" }, () => row.getValue("stat"))
  },
  {
    accessorKey: "level",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Level" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "level" }, () =>
        h(ColouredBadge, { label: row.getValue("level") as string, class: "mx-auto" })
      )
  },
  {
    accessorKey: "draw",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Draw" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "draw" }, () =>
        h(ColouredBadge, { label: row.getValue("draw") as string, class: "mx-auto" })
      )
  },
  {
    accessorKey: "wins",
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Wins", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        if (row.original.category === "Match Record") {
          return `Overall: ${data.value?.[0]?.wins}`
        } else {
          return `Avg: ${Math.round(row.getValue("wins"))}`
        }
      } else {
        return row.getValue("wins")
      }
    }
  },
  {
    accessorKey: "losses",
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Losses", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        if (row.original.category === "Match Record") {
          return `Overall: ${data.value?.[0]?.losses}`
        } else {
          return `Avg: ${Math.round(row.getValue("losses"))}`
        }
      } else {
        return row.getValue("losses")
      }
    }
  },
  {
    id: "index",
    accessorFn: row => {
      const { wins, losses } = row
      return wins + losses > 0 ? wins / (wins + losses) : 0
    },
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Value", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        const { wins, losses } = data.value?.[0] || { wins: 0, losses: 0 }
        if (row.original.category === "Match Record") {
          return `Overall: ${(wins + losses > 0 ? wins / (wins + losses) : 0).toFixed(3)}`
        } else {
          return `Avg: ${(row.getValue("index") as number).toFixed(3)}`
        }
      } else {
        return (row.getValue("index") as number).toFixed(3)
      }
    }
  },
  {
    accessorKey: "titles",
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Titles", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        if (row.original.category === "Match Record") {
          return `Overall: ${data.value?.[0]?.titles ?? 0}`
        } else if (row.original.category === "Environment") {
          return `Avg: ${Math.round(row.getValue("titles"))}`
        }
      } else {
        return row.getValue("titles") ? Math.round(row.getValue("titles") as number) : undefined
      }
    }
  },
  {
    accessorKey: "ytd_wins",
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "YTD Wins", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        if (row.original.category === "Match Record") {
          const { wins, losses } = data.value?.[0] || { wins: 0, losses: 0 }
          return `Overall: ${(wins + losses > 0 ? wins / (wins + losses) : 0).toFixed(3)}`
        } else {
          return `Avg: ${Math.round(row.getValue("ytd_wins"))}`
        }
      } else {
        return row.getValue("ytd_wins")
      }
    }
  },
  {
    accessorKey: "ytd_losses",
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "YTD Losses", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        if (row.original.category === "Match Record") {
          const { wins, losses } = data.value?.[0] || { wins: 0, losses: 0 }
          return `Overall: ${(wins + losses > 0 ? wins / (wins + losses) : 0).toFixed(3)}`
        } else {
          return `Avg: ${Math.round(row.getValue("ytd_losses"))}`
        }
      } else {
        return row.getValue("ytd_losses")
      }
    }
  },
  {
    accessorKey: "ytd_value",
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "YTD Value", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        if (row.original.category === "Match Record") {
          return `Overall: ${data.value?.[0]?.ytd_value.toFixed(3)}`
        } else {
          return `Avg: ${(row.getValue("ytd_value") as number).toFixed(3)}`
        }
      } else {
        return (row.getValue("ytd_value") as number).toFixed(3)
      }
    }
  },
  {
    accessorKey: "ytd_titles",
    aggregationFn: "mean",
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "YTD Titles", type: "number" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        if (row.original.category === "Match Record") {
          return `Overall: ${(data.value?.[0]?.ytd_titles ?? 0).toFixed(3)}`
        } else if (row.original.category === "Environment") {
          return `Avg: ${Math.round(row.getValue("ytd_titles"))}`
        }
      } else {
        return row.getValue("ytd_titles") ? Math.round(row.getValue("ytd_titles") as number) : undefined
      }
    }
  }
])

const grouping = ref<string[]>([])

const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const table = useTemplateRef("table")
</script>

<template>
  <player-wrapper>
    <template #toolbar>
      <player-wl-index-chart
        v-if="data"
        :index="data"
      />
      <u-button
        label="Reset Sorting"
        :icon="ICONS.sortAlpha"
        @click="table?.tableApi.resetSorting()"
        size="sm"
      />
      <u-button
        label="Reset Grouping"
        :icon="ICONS.ungroup"
        @click="table?.tableApi.resetGrouping()"
        size="sm"
      />
      <u-button
        label="Reset Filters"
        :icon="ICONS.noFilter"
        @click="table?.tableApi.resetColumnFilters()"
        size="sm"
      />
      <table-visibility
        v-if="table"
        :table="table!"
      />
    </template>

    <u-table
      ref="table"
      :data
      :columns
      :loading="['idle', 'pending'].includes(status)"
      sticky
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping="grouping"
      v-on:update:grouping="grouping = $event"
      :grouping-options="grouping_options"
      :ui="{ root: 'w-fit min-w-1/3 mx-auto', td: 'empty:p-0' }"
    >
      <template #loading>
        <table-loading-icon />
      </template>

      <template #empty>
        <table-empty-message
          :icon="ICONS.noChart"
          :message="`No win-loss index found for ${playerName}`"
        />
      </template>
    </u-table>
  </player-wrapper>
</template>
