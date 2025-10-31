<script setup lang="ts">
import { TableCellGroup, TableHeaderFilter, TableHeaderGroup, UButton } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type Column, getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("country")

const countryName = useState<string>("country-name")

// API call
const { data: venues, status } = await useFetch<VenueInterface[]>("/api/countries/venues", {
  query: { id },
  default: () => [],
  server: false
})

const columns = computed<TableColumn<VenueInterface>[]>(() => [
  {
    accessorKey: "city",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "City" }),
    cell: ({ row, cell }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "city" }, () => cell.getValue())
  },
  {
    accessorKey: "name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    sortUndefined: "last",
    aggregationFn: "uniqueCount",
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Venue", type: "alpha" })
  }
])

const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const table = useTemplateRef("table")
</script>

<template>
  <dashboard-subpanel
    :title="`Venues located in ${countryName || capitalCase(name as string)}`"
    :icon="ICONS.venue"
    id="venues"
  >
    <template #right>
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
      :data="venues"
      :columns
      :loading="['idle', 'pending'].includes(status)"
      sticky
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
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
        <table-empty-message :message="`No venues located in ${countryName || capitalCase(name as string)}`" />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
