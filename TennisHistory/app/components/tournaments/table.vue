<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableRow } from "@nuxt/ui"

defineProps<{
  tournaments: TournamentType[]
  status: AsyncDataRequestStatus
}>()

const tours = defineModel<string[] | null>("tours")
const tournamentsFilters = defineModel<OptionType[] | null | undefined>("tournaments-filters")
const established = defineModel<number | undefined>("established")
const abolished = defineModel<number | undefined>("abolished")
const sortField = defineModel<SortFieldType[] | undefined>("sort-field")

const router = useRouter()

// Expose table to allow parent to access methods
const table = useTemplateRef<any>("table")
defineExpose({ table })

// Computed to allow refs to be used in columns
const columns = computed(() => tournamentColumns(tours, tournamentsFilters, established, abolished, sortField))

const handleSelectRow = (_e: Event, row: TableRow<TournamentType>) => {
  const { id, name } = row.original
  router.push({
    name: "tournament",
    params: {
      id,
      name: kebabCase(name)
    }
  })
}
</script>

<template>
  <u-table
    ref="table"
    :data="tournaments"
    :columns
    :loading="status === 'pending'"
    sticky
    @select="handleSelectRow"
    render-fallback-value="—"
  >
    <template #loading>
      <loading-icon />
    </template>
    <template #empty>
      <empty
        message="No tournaments found"
        :icon="ICONS.trophyOff"
      >
        <dev-only>
          <tournaments-update />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
