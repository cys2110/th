<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type Column, type Row } from "@tanstack/vue-table"
import { TableFilterHeader, TableGroupHeader, TableRowToggle, TableSortHeader, UIcon } from "#components"

defineProps<{
  countries: Array<CountryInterface>
  pending: boolean
}>()

const router = useRouter()

const columns: Array<TableColumn<CountryInterface>> = [
  { accessorKey: "icon", header: "", cell: ({ cell }) => h(UIcon, { name: cell.getValue() }) },
  {
    accessorKey: "name",
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex gap-0.5 w-fit mx-auto" }, [
        h(TableFilterHeader, { column: column as Column<unknown>, label: "Country", icon: ICONS.globe }),
        h(TableSortHeader, { column: column as Column<unknown> })
      ])
  },
  {
    accessorKey: "continent",
    header: ({ column }) =>
      h("div", { class: "flex gap-0.5 w-fit mx-auto" }, [
        h(TableGroupHeader, { column: column as Column<unknown> }),
        h(TableFilterHeader, { column: column as Column<unknown>, label: "Continent", icon: ICONS.world }),
        h(TableSortHeader, { column: column as Column<unknown> })
      ]),
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
  </u-table>
</template>
