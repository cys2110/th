<script setup lang="ts">
import { TableClientFilterHeader, TableClientGroupHeader, TableClientSortHeader, TableRowToggle, UIcon } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type Column, type Row } from "@tanstack/vue-table"

defineProps<{
  countries: Array<CountryType>
  pending: boolean
}>()

const router = useRouter()

const columns: TableColumn<CountryType>[] = [
  { id: "flag", header: "Flag", cell: ({ row }) => h(UIcon, { name: getFlagCode(row.original) }) },
  {
    accessorKey: "name",
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Country",
          icon: ICONS.globe
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ])
  },
  {
    accessorKey: "continent",
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Continent",
          icon: ICONS.world
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ row, table }) => {
      if (row.getIsGrouped()) {
        return h(
          TableRowToggle,
          {
            row: row as Row<unknown>
          },
          () => row.original.continent
        )
      } else if (!table.getState().grouping.length) {
        return row.original.continent
      }
    }
  }
]

const handleSelectRow = (_e: Event, row: TableRow<CountryType>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    const { id, name } = row.original

    router.push({
      name: "country",
      params: {
        id,
        name: kebabCase(name)
      }
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
        message="No countries found"
        :icon="ICONS.globeOff"
      />
    </template>
  </u-table>
</template>
