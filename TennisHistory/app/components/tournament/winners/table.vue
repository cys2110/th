<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const props = defineProps<{
  editions: BaseEditionType[]
  status: AsyncDataRequestStatus
}>()

const router = useRouter()
const {
  params: { id, name }
} = useRoute("tournament")
const tournamentStore = useTournamentStore()

const table = useTemplateRef("table")
defineExpose({ table })

const columnVisibility = computed(() => {
  const visibility: Record<string, boolean> = {}

  if (props.editions.every(edition => !edition.category)) visibility["category"] = false

  if (props.editions.every(edition => !edition.tfc)) visibility["tfc"] = false

  if (props.editions.every(edition => !edition.start_date)) visibility["start_date"] = false

  if (COUNTRY_DRAWS.includes(id)) visibility["winner_type"] = false

  return visibility
})

const handleSelectRow = (_e: Event, row: TableRow<BrokenOutEditionType>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "edition",
      params: {
        id,
        name,
        year: row.original.year,
        edId: row.original.id
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
    :data="editions"
    :columns="editionColumns"
    :loading="status === 'pending'"
    sticky
    render-fallback-value="—"
    @select-row="handleSelectRow"
    v-model:column-visibility="columnVisibility"
    :initial-state="{
      grouping: ['year']
    }"
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
        :message="`No editions have been played for ${tournamentStore.name}.`"
        :icon="ICONS.calendarOff"
      >
        <dev-only>
          <editions-update />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
