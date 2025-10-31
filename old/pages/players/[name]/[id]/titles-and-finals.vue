<script setup lang="ts">
import { ColouredBadge, TableCellGroup, TableHeaderFilter, TableHeaderGroup, TableHeaderRange, TableHeaderSort, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import {
  type Column,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"

definePageMeta({ name: "titles-and-finals" })
const {
  params: { id }
} = useRoute("titles-and-finals")
const playerName = useState<string>("player-name")

const selection = ref<"Titles" | "Finals">("Titles")

const { data: events, status } = await useFetch<EventInterface[]>("/api/players/titles-and-finals", {
  key: `titles-and-finals-${id}`,
  query: { id, selection },
  default: () => [],
  server: false
})

const columns = computed<TableColumn<EventInterface>[]>(() => [
  {
    accessorKey: "type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "S/D" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "type" }, () =>
        h(ColouredBadge, { label: row.getValue("type") as string, class: "mx-auto" })
      )
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
    accessorKey: "category",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Category" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "category" }, () => row.getValue("category"))
  },
  {
    accessorKey: "tournament.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Tournament" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } },
            class: "hover-link default-link w-fit"
          },
          () => row.original.tournament.name
        )
      }
    }
  },
  {
    accessorKey: "year",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Year" }),
    aggregationFn: "extent"
  },
  {
    id: "date",
    accessorFn: row => `${row.end_date.year}-${row.end_date.month}-${row.end_date.day}`,
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Date", type: "alpha" }),
    cell: ({ row }) => dateTimeFormat.format(getDate(row.original.end_date))
  }
])

const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const table = useTemplateRef("table")

const handleSelectRow = async (row: TableRow<EventInterface>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    await navigateTo({
      name: "event",
      params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name), year: row.original.year, eid: row.original.id }
    })
  }
}
</script>

<template>
  <player-wrapper>
    <template #toolbar>
      <u-radio-group
        v-model="selection"
        :items="['Titles', 'Finals']"
        orientation="horizontal"
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
      :data="events"
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
      @select="handleSelectRow"
      :ui="{ root: 'w-fit min-w-1/3 mx-auto', tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
    >
      <template #loading>
        <table-loading-icon />
      </template>

      <template #empty>
        <table-empty-message
          :icon="ICONS.noTournament"
          :message="`No ${selection === 'Titles' ? 'titles won' : 'finals reached'} by ${playerName}`"
        />
      </template>
    </u-table>
  </player-wrapper>
</template>
