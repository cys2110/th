<script setup lang="ts">
import { TableRowToggle } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type Row } from "@tanstack/vue-table"

const props = defineProps<{
  countries: Array<CountryInterface>
  pending: boolean
}>()

const router = useRouter()

const columns: Array<TableColumn<CountryInterface>> = [
  { accessorKey: "icon", header: "" },
  { accessorKey: "name", aggregationFn: "uniqueCount" },
  {
    accessorKey: "continent",
    cell: ({ row, table }) => {
      if (row.getIsGrouped()) {
        return h(TableRowToggle, { row: row as Row<unknown> }, () => row.original.continent)
      } else if (!table.getState().grouping.length) {
        return row.original.continent
      }
    }
  }
]

const handleSelectRow = (_e: Event, row: TableRow<CountryInterface>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    const { id, name } = row.original

    router.push({
      name: "country",
      params: { id, name: kebabCase(name) }
    })
  }
}
</script>

<template>
  <u-table
    :data="countries"
    :columns
    :loading="pending"
    sticky
    @select="handleSelectRow"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :grouping-options="{
      getGroupedRowModel: getGroupedRowModel()
    }"
    :ui="{
      root: 'lg:max-w-1/2 mx-auto',
      tbody: '[&>tr]:data-[selectable=true]:cursor-pointer [&>tr]:data-[selectable=true]:hover:bg-elevated/50 [&>tr]:even:bg-elevated/25',
      td: 'empty:p-0'
    }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        title="No countries found"
        :icon="ICONS.globeOff"
        class="mx-2"
      />
    </template>

    <template #icon-cell="{ row }">
      <u-icon :name="row.original.icon" />
    </template>

    <template #name-header="{ column }">
      <div class="flex gap-0.5 w-fit mx-auto">
        <u-select-menu
          placeholder="Country"
          variant="none"
          clear
          :model-value="<string>column.getFilterValue()"
          @update:model-value="value => column.setFilterValue(value)"
          :icon="ICONS.globe"
          value-key="name"
          label-key="name"
          :items="countries"
        />

        <table-sort-header :column />
      </div>
    </template>

    <template #continent-header="{ column }">
      <div class="flex gap-0.5 w-fit mx-auto">
        <table-group-header :column />

        <table-filter-header
          :column
          label="Continent"
          :icon="ICONS.world"
        />

        <table-sort-header :column />
      </div>
    </template>
  </u-table>
</template>
