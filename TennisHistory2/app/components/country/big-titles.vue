<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const props = defineProps<{
  country: CountryType
}>()

const {
  params: { id }
} = useRoute("country")

const router = useRouter()

const table = useTemplateRef("table")

// API call
// const { data, status, error } = await useFetch("/api/country/big-titles", {
//   query: { id },
//   default: () => ({ results: [] as CountryTitleType[], statusObjects: [] })
// })

// const handleSelectRow = (_e: Event, row: TableRow<CountryTitleType>) => {
//   if (row.getIsGrouped()) {
//     row.toggleExpanded()
//   } else {
//     router.push({
//       name: "player",
//       params: {
//         id: row.original.id,
//         name: kebabCase(`${row.original.first_name}-${row.original.last_name}`)
//       }
//     })
//   }
// }
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles representing ${country.name}`"
    :icon="ICONS.trophy"
  >
    <template #right>
      <!-- <u-button
        v-if="table?.tableApi.getState().grouping.length"
        :icon="ICONS.groupOff"
        @click="table?.tableApi.resetGrouping()"
      />

      <u-button
        v-if="table?.tableApi.getState().sorting.length"
        :icon="ICONS.sort"
        @click="table?.tableApi.resetSorting()"
      />

      <u-button
        v-if="Object.keys(table?.tableApi.getState().columnFilters ?? {}).length"
        :icon="ICONS.filterOff"
        @click="table?.tableApi.resetColumnFilters()"
      /> -->
    </template>

    <!-- <u-table
      ref="table"
      :data="data.results"
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
    </u-table> -->
  </dashboard-subpanel>
</template>
