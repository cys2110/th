<script setup lang="ts">
import {
  ColouredBadge,
  CountryLink,
  TableCellGroup,
  TableHeaderFilter,
  TableHeaderGroup,
  TableHeaderName,
  TableHeaderRange,
  TableHeaderSort,
  UButton,
  ULink
} from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import {
  type Column,
  createColumnHelper,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: winners, status } = await useFetch<TournamentAgeType[]>("/api/tournaments/winners-by-age", {
  key: `tournament-age-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<TournamentAgeType>()

const columns = computed<TableColumn<TournamentAgeType>[]>(() => [
  {
    id: "tour",
    accessorKey: "player.tour",
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    cell: ({ row, cell }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.getValue("tour") as string })
      )
  },
  {
    accessorKey: "type",
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Type" }),
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "type" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.getValue("type") as string })
      )
  },
  {
    accessorKey: "year",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Year" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            to: { name: "event", params: { id, name, year: row.original.year, eid: row.original.id } },
            class: "hover-link default-link w-fit"
          },
          () => row.original.year
        )
      }
    }
  },
  {
    id: "age",
    accessorFn: row => (row.age ? row.age.months * 30.4375 + row.age?.days : undefined),
    sortingFn: (rowA, rowB) => {
      const ageA = rowA.original.age
      const ageB = rowB.original.age

      if (!ageA) return 1
      if (!ageB) return -1

      if (ageA.months === ageB.months) {
        return ageA.days < ageB.days ? -1 : 1
      } else {
        return ageA.months < ageB.months ? -1 : 1
      }
    },
    aggregationFn: (leafRows, childRows) => {
      const totalDays = childRows
        .filter(row => row.original.age)
        .reduce((sum, row) => sum + row.original.age!.months * 30.4375 + (row.original.age?.days || 0), 0)
      const count = childRows.filter(row => row.original.age).length
      const averageDays = totalDays / count

      const years = Math.floor(averageDays / 365.25)
      const months = Math.floor((averageDays % 365.25) / 30.4375)
      const days = Math.floor((averageDays % 365.25) % 30.4375)

      return `Avg: ${years} years, ${months} months, ${days} days`
    },
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Age", type: "number" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return row.original.age
          ? `${Math.floor(row.original.age.months / 12)} years, ${row.original.age.months % 12} months, ${row.original.age.days} days`
          : "—"
      }
    }
  },
  columnHelper.group({
    header: "Player",
    columns: [
      {
        accessorKey: "player.country.name",
        filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(CountryLink, {
              country: row.original.player.country,
              class: "mx-auto"
            })
          }
        }
      },
      {
        id: "player_name",
        accessorFn: row => `${row.player.last_name}, ${row.player.first_name}`,
        filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) => {
          if (!row.getIsGrouped() || grouping.value.length === 0) {
            return h(
              ULink,
              {
                to: {
                  name: "player",
                  params: { id: row.original.player.id, name: kebabCase(`${row.original.player.first_name}-${row.original.player.last_name}`) }
                },
                class: "hover-link default-link w-fit"
              },
              () => `${row.original.player.first_name} ${row.original.player.last_name}`
            )
          }
        }
      }
    ]
  })
])

const table = useTemplateRef("table")
const columnVisibility = ref({ tour: tours.length > 1 })
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <client-only>
    <teleport to="#chart-container">
      <tournament-age-chart
        v-if="mdAndUp"
        :winners
      />
    </teleport>
  </client-only>
  <div class="flex items-center justify-between mb-5">
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
  </div>
  <u-table
    ref="table"
    :data="winners"
    :columns
    :loading="['idle', 'pending'].includes(status)"
    sticky
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :grouping
    v-on:update:grouping="grouping = $event"
    :grouping-options="grouping_options"
    v-model:column-visibility="columnVisibility"
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <table-loading-icon />
    </template>

    <template #empty>
      <table-empty-message
        :icon="ICONS.noTournament"
        message="No winners found for {{ tournamentName }}"
      />
    </template>
  </u-table>
</template>
