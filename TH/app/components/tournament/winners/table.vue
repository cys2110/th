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

const grouping = computed(() => {
  if (COUNTRY_DRAWS.includes(id) || id === "9210") {
    return []
  }
  return ["year"]
})

const columnVisibility = computed(() => {
  const visibility: Record<string, boolean> = {}

  if (COUNTRY_DRAWS.includes(id) || id === "9210") visibility["winner_type"] = false

  if (COUNTRY_DRAWS.includes(id) || id === "9210") visibility["winner_tour"] = false

  return visibility
})

const handleSelectRow = (_e: Event, row: TableRow<BaseEditionType>) => {
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
    sticky
    :loading="status === 'pending'"
    :grouping-options="{
      getGroupedRowModel: getGroupedRowModel()
    }"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    @select="handleSelectRow"
    render-fallback-value="—"
    v-model:column-visibility="columnVisibility"
    :grouping
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
          <edition-update />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
