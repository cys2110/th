<script setup lang="ts">
import { TableHeaderFilter, UIcon } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, type Column } from "@tanstack/vue-table"
defineProps<{ countries: CountryInterface[]; status: APIStatusType }>()

const columns: TableColumn<CountryInterface>[] = [
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) => h(UIcon, { name: getFlagCode(row.original), class: "size-5" }),
    footer: ({ table }) => `${table.getRowCount()} countries`
  },
  {
    accessorKey: "name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<any>, label: "Country" })
  }
]

const handleSelectRow = async (row: TableRow<CountryInterface>) => {
  await navigateTo({ name: "country", params: { id: row.original.id, name: kebabCase(row.original.name) } })
}
</script>

<template>
  <u-dashboard-panel>
    <template #header>
      <u-dashboard-navbar>
        <template #title>
          <page-title />
        </template>
      </u-dashboard-navbar>
    </template>

    <template #body>
      <u-table
        :data="countries"
        :columns
        :loading="status === 'pending'"
        sticky
        :faceted-options="{
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues()
        }"
        @select="handleSelectRow"
        :ui="{ root: 'w-fit min-w-1/3 mx-auto', tbody: '[&>tr]:cursor-pointer' }"
      >
        <template #loading>
          <table-loading-message />
        </template>

        <template #empty>
          <empty-table
            :icon="ICONS.noCountries"
            message="No countries found"
          />
        </template>
      </u-table>
    </template>
  </u-dashboard-panel>
</template>
