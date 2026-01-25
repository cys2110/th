<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

defineProps<{
  country: CountryType
}>()

const {
  params: { id }
} = useRoute("country")
const router = useRouter()
const table = useTemplateRef("table")

// API call
const { data, status, error } = await useFetch("/api/country/big-titles", {
  query: { id },
  default: () => []
})

watch(
  error,
  newError => {
    if (newError) {
      if (newError.statusMessage) {
        console.error(newError.statusMessage, newError.data?.data)
      } else {
        console.error(newError)
      }
    }
  },
  { immediate: true }
)

const handleSelectRow = (_e: Event, row: TableRow<CountryTitleType>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "player",
      params: {
        id: row.original.id,
        name: kebabCase(`${row.original.first_name}-${row.original.last_name}`)
      }
    })
  }
}
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles representing ${country.name}`"
    :icon="ICONS.trophy"
  >
    <template #right></template>

    <u-table
      ref="table"
      :data
      :columns="countryTitlesColumns"
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
      :ui="{ td: 'empty:p-0' }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :message="`No players have won big titles representing ${country.name}`"
          :icon="ICONS.trophyOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
