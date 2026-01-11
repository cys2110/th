<script setup lang="ts">
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const {
  params: { id }
} = useRoute("tournament")
const tournamentStore = useTournamentStore()

const { data, status } = await useFetch("/api/tournament/scores-stats", {
  query: { id },
  default: () => [],
  onResponseError: ({ error }) => console.error(error)
})

const table = useTemplateRef("table")
const columnVisibility = computed(() => ({
  tour: tournamentStore.tours.length > 1
}))
</script>

<template>
  <dashboard-subpanel
    title="Winners by Sets and Games Lost"
    :icon="ICONS.scores"
  >
    <template #right>
      <table-client-clear-filters
        v-if="table"
        :table
      />

      <tournament-numbers-scores-stats-chart
        :winners="data"
        :status
      />
    </template>

    <u-table
      ref="table"
      :data
      :columns="tournamentScoresStatsColumns()"
      :loading="status === 'pending'"
      sticky
      v-model:column-visibility="columnVisibility"
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping-options="{
        getGroupedRowModel: getGroupedRowModel()
      }"
      :ui="{ th: 'text-center py-1', td: 'text-center empty:p-0' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          :message="`No players have won ${tournamentStore.name}`"
          :icon="ICONS.trophyOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
