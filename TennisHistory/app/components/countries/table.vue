<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

defineProps<{
  countries: Array<CountryType>
  pending: boolean
}>()

const router = useRouter()

const columns: TableColumn<CountryType>[] = [
  { id: "flag", header: "Flag" },
  { accessorKey: "name", aggregationFn: "uniqueCount" },
  { accessorKey: "continent" }
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

    <template #flag-cell="{ row }">
      <u-icon
        v-if="!row.getIsGrouped()"
        :name="getFlagCode(row.original)"
      />
    </template>

    <template #name-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-filter-header
          :column
          label="Country"
          :icon="ICONS.globe"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #continent-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-group-header :column />
        <table-client-filter-header
          :column
          label="Continent"
          :icon="ICONS.world"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #continent-cell="{ row }">
      <table-row-toggle
        v-if="row.getIsGrouped()"
        :row
      >
        {{ row.original.continent }}
      </table-row-toggle>

      <template v-else-if="row.depth < 1">
        {{ row.original.continent }}
      </template>

      <template v-else>{{ " " }}</template>
    </template>
  </u-table>
</template>
