<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"
import type { AsyncDataRequestStatus } from "#app"

defineProps<{
  events: ActivityType[]
  status: AsyncDataRequestStatus
}>()

const {
  params: { id }
} = useRoute("activity")
const router = useRouter()

const playerStore = usePlayerStore()
const table = useTemplateRef("table")
defineExpose({ table })

const matchType = defineModel()

const columnVisibility = computed(() => {
  const visibility: Record<string, boolean> = {}

  visibility["partner"] = matchType.value === "Doubles"

  const currentGrouping = table.value?.tableApi.getState().grouping || []

  if (currentGrouping.includes("tournament_name") || currentGrouping.includes("category")) {
    visibility["year"] = false
    visibility["level"] = false

    if (currentGrouping.includes("tournament_name")) {
      visibility["category"] = false
    } else {
      visibility["tournament_name"] = false
    }
  }

  return visibility
})

const handleSelectRow = (_e: Event, row: TableRow<ActivityType>) => {
  const {
    match: { stats, draw, match_no },
    tournament,
    year,
    id: edId,
    tour,
    type
  } = row.original

  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else if (row.original.match.stats) {
    router.push({
      name: "match",
      params: {
        id: tournament.id,
        name: kebabCase(tournament.name),
        year,
        edId
      },
      query: {
        tour,
        type,
        draw,
        match_no
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
    :data="events"
    :columns="activityColumns(playerStore.paramName, id)"
    :loading="status === 'pending'"
    sticky
    @select="handleSelectRow"
    v-model:column-visibility="columnVisibility"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :grouping-options="{
      getGroupedRowModel: getGroupedRowModel()
    }"
    :initial-state="{
      grouping: ['tournament_name']
    }"
    :meta="{
      class: {
        tr: (row: TableRow<ActivityType>) =>
          `${row.original.match.draw === 'Main' ? '' : 'bg-elevated'} ${row.original.match.stats || row.getIsGrouped() ? '' : 'cursor-default data-[selectable=true]:hover:bg-default!'}`
      }
    }"
    :ui="{ th: 'mx-2', td: 'empty:p-0 mx-2' }"
  >
    <template #loading>
      <loading-icon />
    </template>
    <template #empty>
      <empty
        :message="`${playerStore.fullName} has not played any matches for the selected filters.`"
        :icon="ICONS.calendarOff"
      />
    </template>
  </u-table>
</template>
