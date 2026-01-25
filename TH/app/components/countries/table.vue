<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

defineProps<{
  countries: CountryType[]
  status: AsyncDataRequestStatus
}>()

const router = useRouter()

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
    :columns="countriesColumns"
    :loading="status === 'pending'"
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
