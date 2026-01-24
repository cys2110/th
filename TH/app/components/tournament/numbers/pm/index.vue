<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")
const router = useRouter()
const tournamentStore = useTournamentStore()

const { data, status, error } = await useFetch("/api/tournament/pm", {
  query: { id },
  default: () => []
})

watch(error, () => {
  if (error.value) {
    if (error.value.statusMessage) {
      console.error(error.value.statusMessage, error.value.data?.data)
    } else {
      console.error(error.value)
    }
  }
})

const columnVisibility = computed(() => ({
  tour: tournamentStore.tours.length > 1
}))

const handleSelectRow = (_e: Event, row: TableRow<TournamentPmType>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "edition",
      params: {
        id,
        name: kebabCase(name),
        year: row.original.year.toString(),
        edId: row.original.id
      }
    })
  }
}
</script>

<template>
  <dashboard-subpanel
    title="Historical Prize Money"
    :icon="ICONS.awards"
  >
    <template #right>
      <tournament-numbers-pm-chart
        :rounds="data"
        :status="status"
      />
    </template>

    <u-table
      ref="table"
      :data
      :columns="tournamentAwardsColumns()"
      :loading="status === 'pending'"
      sticky
      @select="handleSelectRow"
      :initial-state="{
        grouping: ['year']
      }"
      v-model:column-visibility="columnVisibility"
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping-options="{
        getGroupedRowModel: getGroupedRowModel()
      }"
      :ui="{ root: 'max-h-125!', th: 'text-center', td: 'empty:p-0 text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          :message="`${tournamentStore.name} has not awarded any prize money`"
          :icon="ICONS.awardsOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
