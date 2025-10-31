<script setup lang="ts">
import { ColouredBadge, TableCellGroup, TableHeaderFilter, TableHeaderGroup, UButton, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type Column, getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("country")
const countryName = useState<string>("country-name")

// API call
const { data: events, status } = await useFetch<EventInterface[]>("/api/countries/events", {
  query: { id },
  default: () => [],
  server: false
})

const columns = computed<TableColumn<EventInterface>[]>(() => [
  {
    accessorKey: "tours",
    filterFn: "arrIncludesSome",
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tours" }, () =>
        h(
          "div",
          { class: "flex justify-center items-center gap-2" },
          row.original.tours.map(tour => h(ColouredBadge, { label: tour }))
        )
      )
  },
  {
    id: "tournament",
    accessorKey: "tournament.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tournament" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tournament" }, () =>
        h(
          ULink,
          {
            to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } },
            class: "hover-link default-link w-fit mx-auto"
          },
          () => row.getValue("tournament") as string
        )
      )
  },
  {
    accessorKey: "year",
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Year", type: "number" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "year" }, () =>
        h(
          ULink,
          {
            to: {
              name: "event",
              params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name), year: row.original.year, eid: row.original.id }
            },
            class: "hover-link default-link w-fit mx-auto"
          },
          () => row.getValue("year") as string
        )
      )
  },
  {
    id: "venues",
    accessorFn: row => row.venues.map(v => v.name ?? v.city),
    filterFn: "arrIncludesSome",
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Venues" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          "div",
          { class: "flex flex-col items-center" },
          row.original.venues.map(venue => h("div", venue.name ? `${venue.name}, ${venue.city}` : venue.city))
        )
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
  <dashboard-subpanel
    :title="`Events which took place in ${countryName || capitalCase(name as string)}`"
    :icon="ICONS.event"
    id="events"
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
      :data="events"
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
        <table-empty-message
          :icon="ICONS.noCalendar"
          :message="`No events have taken place in ${countryName || capitalCase(name as string)}`"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
