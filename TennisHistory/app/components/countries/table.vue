<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

defineProps<{
  countries: CountryType[]
  status: AsyncDataRequestStatus
}>()

const router = useRouter()
const table = useTemplateRef<any>("table")
defineExpose({ table })

const handleSelectRow = (e: Event, row: TableRow<CountryType>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "country",
      params: {
        id: row.original.id,
        name: kebabCase(row.original.name)
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
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
    :ui="{ root: 'max-w-2/3 mx-auto', td: 'empty:p-0' }"
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
