<script setup lang="ts">
import { ColouredBadge, TableCellGroup, TableHeaderFilter, TableHeaderGroup, UBadge, UProgress } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import {
  type Column,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"

definePageMeta({ name: "stats" })
const {
  ui: { icons }
} = useAppConfig()
const {
  params: { id }
} = useRoute("stats")

const playerName = useState<string>("player-name")
const playerYears = useState<number[]>("player-years")

interface APIResponse {
  surface: SurfaceInterface
  category: CategoryType
  draw: DrawType
  level: "Tour" | "Challenger" | "ITF"
  year: number
}

// API call
const { data, status } = await useFetch<APIResponse[]>("/api/players/stats", {
  key: `stats-${id}`,
  query: { id },
  default: () => [],
  server: false
})

interface TableInterface {
  label: string
  category: string
  value: number
  low: boolean
  percent: boolean
  surface?: string
  event_category?: string
  draw?: DrawType
  level?: "Tour" | "Challenger" | "ITF"
}

const stats = computed<TableInterface[]>(() => {
  if (data.value.length) {
    const results = get(data)
    const allStats = []

    for (const statLabel of MATCH_STATS) {
      if (statLabel.key) {
        const value = results.map(s => ({
          label: statLabel.label,
          category: statLabel.category,
          value: s[statLabel.key as keyof APIResponse],
          low: statLabel.low,
          percent: statLabel.percent,
          surface: s.surface?.surface,
          event_category: s.category,
          draw: s.draw,
          level: s.level,
          year: s.year
        }))
        allStats.push(...value)
      } else if (statLabel.label === "Service games won") {
        const value = results.map(s => {
          const numerator =
            (s[statLabel.denominators![0] as keyof APIResponse] as number) -
            ((s[statLabel.numerators![1] as keyof APIResponse] as number) - (s[statLabel.numerators![1] as keyof APIResponse] as number))
          const denominator = s[statLabel.denominators![0] as keyof APIResponse] as number

          return {
            label: statLabel.label,
            category: statLabel.category,
            value: denominator === 0 ? 0 : Math.round((numerator / denominator) * 100),
            low: statLabel.low,
            percent: statLabel.percent,
            surface: s.surface?.surface,
            event_category: s.category,
            draw: s.draw,
            level: s.level,
            year: s.year
          }
        })
        allStats.push(...value)
      } else {
        const value = results.map(s => {
          const numerator = statLabel.numerators!.reduce((acc, curr) => {
            return acc + (s[curr as keyof APIResponse] as number)
          }, 0)
          const denominator = statLabel.denominators!.reduce((acc, curr) => {
            return acc + (s[curr as keyof APIResponse] as number)
          }, 0)

          return {
            label: statLabel.label,
            category: statLabel.category,
            value: denominator === 0 ? 0 : Math.round((numerator / denominator) * 100),
            low: statLabel.low,
            percent: true,
            surface: s.surface?.surface,
            event_category: s.category,
            draw: s.draw,
            level: s.level,
            year: s.year
          }
        })
        allStats.push(...value)
      }
    }

    return allStats as TableInterface[]
  }
  return []
})

const columns: TableColumn<TableInterface>[] = [
  {
    accessorKey: "category",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Category", type: "alpha" }),
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        return row.original.category
      }
    }
  },
  {
    id: "stat",
    accessorKey: "label",
    header: "Stat"
  },
  {
    accessorKey: "level",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Level", type: "alpha" }),
    cell: ({ row, table }) => {
      if (row.getIsGrouped()) {
        const columnFilter = table.getColumn("level")?.getFilterValue() as string[]
        if (columnFilter) {
          return columnFilter.map(filter => h(ColouredBadge, { label: filter, class: "mx-1" }))
        } else {
          return h(UBadge, {
            color: "primary",
            label: "All"
          })
        }
      }
    }
  },
  {
    accessorKey: "surface",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Surface", type: "alpha" }),
    cell: ({ row, table }) => {
      if (row.getIsGrouped()) {
        const columnFilter = table.getColumn("surface")?.getFilterValue() as string[]
        if (columnFilter) {
          return columnFilter.join(", ")
        } else {
          return "All"
        }
      }
    }
  },
  {
    accessorKey: "draw",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Draw", type: "alpha" }),
    cell: ({ row, table }) => {
      if (row.getIsGrouped()) {
        const columnFilter = table.getColumn("draw")?.getFilterValue() as string[]
        if (columnFilter) {
          return columnFilter.map(filter => h(ColouredBadge, { label: filter, class: "mx-1" }))
        } else {
          return h(UBadge, {
            color: "primary",
            label: "All"
          })
        }
      }
    }
  },
  {
    accessorKey: "year",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Year", type: "number" }),
    cell: ({ row, table }) => {
      if (row.getIsGrouped()) {
        const columnFilter = table.getColumn("year")?.getFilterValue() as string[]
        if (columnFilter) {
          return columnFilter.join(", ")
        } else {
          return "All"
        }
      }
    }
  },
  {
    accessorKey: "value",
    aggregationFn: "mean",
    meta: { class: { td: "min-w-100" } },
    header: "",
    cell: ({ row, cell, table }) => {
      if (row.original.percent) {
        return h(
          UProgress,
          {
            modelValue: cell.getValue() as number,
            max: 100
          },
          {
            status: () => `${Math.round(cell.getValue() as number)}%`
          }
        )
      } else if (row.original.category === "Service Speed") {
        return h(
          "div",
          {
            class: "flex flex-col items-center"
          },
          [h("div", {}, `${Math.round(cell.getValue() as number)} km/h`), h("div", {}, `${Math.round(kmhToMph(cell.getValue() as number))} mph`)]
        )
      } else {
        const filtered = table.getFilteredRowModel().rows.filter(r => r.original.label === row.original.label)
        const sumOfValues = filtered.reduce((acc, curr) => acc + (curr.original.value ?? 0), 0)
        return sumOfValues
      }
    }
  }
]

const table = useTemplateRef("table")
const grouping = ref<string[]>(["stat"])
const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: false,
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <player-wrapper>
    <template #toolbar>
      <u-button
        label="Reset Sorting"
        :icon="ICONS.sortAlpha"
        @click="table?.tableApi.resetSorting()"
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

    <client-only>
      <u-table
        ref="table"
        :data="stats"
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
        :ui="{ td: 'empty:p-0' }"
      >
        <template #loading>
          <table-loading-icon />
        </template>
        <template #empty>
          <table-empty-message
            :icon="ICONS.noChart"
            :message="`No stats available for ${playerName}`"
          />
        </template>
      </u-table>
    </client-only>
  </player-wrapper>
</template>
