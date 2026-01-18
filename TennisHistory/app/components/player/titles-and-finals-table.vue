<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

defineProps<{
  events: TitlesAndFinalsType[]
  status: AsyncDataRequestStatus
}>()

const toast = useToast()
const playerStore = usePlayerStore()
const table = useTemplateRef("table")
defineExpose({ table })

const handleSelectRow = (_e: Event, row: TableRow<TitlesAndFinalsType>) => {
  toast.clear()

  const {
    tournament: { id, name },
    id: edId,
    year
  } = row.original

  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    toast.add({
      title: "Go to...",
      duration: Infinity,
      progress: false,
      actions: [
        {
          label: name,
          icon: ICONS.trophy,
          to: {
            name: "tournament",
            params: { id, name: kebabCase(name) }
          }
        },
        {
          label: year.toString(),
          icon: ICONS.calendar,
          to: {
            name: "edition",
            params: {
              id,
              name: kebabCase(name),
              edId,
              year
            }
          }
        }
      ]
    })
  }
}

onUnmounted(() => {
  toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
</script>

<template>
  <u-table
    ref="table"
    :data="events"
    :columns="titlesAndFinalsColumns"
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
    :meta="{
      class: {
        tr: (row: TableRow<TitlesAndFinalsType>) => (row.original.title ? 'bg-emerald-700/20' : '')
      }
    }"
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <loading-icon />
    </template>
    <template #empty>
      <empty
        :icon="ICONS.trophyOff"
        :message="`${playerStore.fullName} has not ${table?.tableApi.getColumn('title')?.getFilterValue() === true ? 'won' : 'played'} any ${
          table?.tableApi.getColumn('title')?.getFilterValue() === true ? 'titles' : 'finals'
        }${table?.tableApi.getState().columnFilters.length ? ' for the selected filters' : ''}.`"
      />
    </template>
  </u-table>
</template>
