<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

defineProps<{
  matches: ResultMatchType[]
  status: AsyncDataRequestStatus
  refresh: () => void
}>()

const router = useRouter()
const tournamentStore = useTournamentStore()
const { devMode } = useRuntimeConfig().public
const {
  params: { id, name, edId, year }
} = useRoute("results")

const table = useTemplateRef<any>("table")
defineExpose({ table })

const handleSelectRow = (_e: Event, row: TableRow<ResultMatchType>) => {
  if (devMode || row.original.stats) {
    const { tour, draw, type, match_no } = row.original
    router.push({
      name: "match",
      params: {
        id,
        name,
        edId,
        year
      },
      query: {
        tour,
        draw,
        type,
        match_no
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
    :data="matches"
    :columns="resultsColumns"
    :loading="status === 'pending'"
    sticky
    render-fallback-value="—"
    @select="handleSelectRow"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :grouping-options="{
      getGroupedRowModel: getGroupedRowModel()
    }"
    :meta="{
      class: {
        tr: (row: TableRow<ResultMatchType>) => devMode && !row.original.stats ? 'bg-warning/20 cursor-pointer' : row.original.stats ? 'cursor-pointer' : ''
      }
    }"
    :ui="{ th: 'py-1', td: 'empty:p-0' }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty :message="`No matches played in ${tournamentStore.name} ${year}`">
        <dev-only>
          <match-country-update
            v-if="COUNTRY_DRAWS.includes(id)"
            :refresh
          />
          <match-update
            v-else
            :refresh
          />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
