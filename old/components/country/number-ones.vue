<script setup lang="ts">
import { ColouredBadge, CountryLink, TableCellGroup, TableHeaderFilter, TableHeaderGroup, TableHeaderName } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type Column, getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("country")

const countryName = useState<string>("country-name")

// API call
const { data: players, status } = await useFetch<PlayerInterface[]>("/api/countries/number-ones", {
  query: { id },
  default: () => [],
  server: false
})

const columns = computed<TableColumn<PlayerInterface>[]>(() => [
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { label: row.getValue("tour") as string, class: "mx-auto" })
      )
  },
  {
    id: "country",
    accessorFn: row => row.country.name,
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(CountryLink, { country: row.original.country, iconOnly: true, class: "mx-auto" })
      }
    }
  },
  {
    id: "name",
    accessorFn: row => `${row.last_name}, ${row.first_name}`,
    filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return `${row.original.first_name} ${row.original.last_name}`
      }
    }
  },
  {
    accessorKey: "ch_singles",
    header: "Career High (Singles)",
    cell: ({ row }) => {
      if (row.original.ch_singles && (!row.getIsGrouped() || grouping.value.length === 0)) {
        return h(
          "div",
          {
            class: "text-center"
          },
          [h("div", row.original.ch_singles ?? "—"), h("div", dateTimeFormat.format(getDate(row.original.singles_ch_date!)))]
        )
      }
    }
  },
  {
    accessorKey: "ch_doubles",
    header: "Career High (Doubles)",
    cell: ({ row }) => {
      if (row.original.ch_doubles && (!row.getIsGrouped() || grouping.value.length === 0)) {
        return h(
          "div",
          {
            class: "text-center"
          },
          [h("div", row.original.ch_doubles ?? "—"), h("div", dateTimeFormat.format(getDate(row.original.doubles_ch_date!)))]
        )
      }
    }
  }
])

const table = useTemplateRef("table")
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const handleSelectRow = async (row: TableRow<PlayerInterface>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    await navigateTo({ name: "player", params: { id: row.original.id, name: kebabCase(`${row.original.first_name}-${row.original.last_name}`) } })
  }
}
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have achieved No. 1 ranking representing ${countryName || capitalCase(name as string)}`"
    :icon="ICONS.one"
    id="number-ones"
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
      :data="players"
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
      @select="handleSelectRow"
      :ui="{ root: 'w-fit min-w-1/3 mx-auto', tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
    >
      <template #loading>
        <table-loading-icon />
      </template>

      <template #empty>
        <table-empty-message
          :icon="ICONS.noPlayer"
          :message="`No players who have achieved No. 1 ranking representing ${countryName || capitalCase(name as string)}`"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
