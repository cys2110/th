<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"

const { results, status, firstName, lastName } = defineProps<{
  results: RecordAPIType
  status: APIStatusType
  tour: TourType
  firstName?: string
  lastName?: string
}>()
const {
  ui: { icons }
} = useAppConfig()

const eventResults = computed(() => {
  const newEvents: (RecordInterface & { type: "Singles" | "Doubles" })[] = []
  results.singles.forEach(singles => {
    singles.resultsPerTid.forEach(s => {
      newEvents.push({ ...s, type: "Singles" })
    })
  })
  results.doubles.forEach(doubles => {
    doubles.resultsPerTid.forEach(s => {
      newEvents.push({ ...s, type: "Doubles" })
    })
  })
  return newEvents
})

const columns: TableColumn<RecordInterface & { type: "Singles" | "Doubles" }>[] = [
  { id: "expand" },
  { id: "tournament", accessorKey: "tournament.name" },
  { accessorKey: "type" },
  { accessorKey: "year" },
  { accessorKey: "round" }
]

const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: false,
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <u-table
    :data="eventResults"
    :columns
    :loading="status === 'pending'"
    :grouping="['tournament', 'type']"
    :grouping-options="grouping_options"
    sticky
    :ui="{
      root: 'scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent',
      td: 'empty:p-0' // helps with the colspaned row added for expand slot
    }"
    :empty="`No records found for ${firstName} ${lastName || ''}`"
  >
    <template #expand-cell="{ row }">
      <u-button
        variant="link"
        color="neutral"
        class="mr-2"
        size="xs"
        :icon="icons.chevronDoubleRight"
        :ui="{ leadingIcon: row.getIsExpanded() ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200' }"
        @click="row.toggleExpanded()"
      />
    </template>

    <template #tournament-header="{ column }">
      <sort-table-header
        :column
        label="Tournament"
        type="alpha"
      />
    </template>

    <template #tournament-cell="{ row }">
      <u-link
        v-if="row.getIsGrouped() && row.depth === 0"
        :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
        class="hover-link font-semibold"
      >
        {{ row.original.tournament.name }}
      </u-link>
      <template v-else>{{ "" }}</template>
    </template>

    <template #type-header="{ column }">
      <sort-table-header
        :column
        label="Type"
        type="alpha"
      />
    </template>

    <template #type-cell="{ row }">
      <u-badge
        v-if="row.getIsGrouped() && row.depth === 1"
        class="font-semibold"
        :label="row.original.type"
        :color="row.original.type === 'Singles' ? 'singles' : 'doubles'"
      />
      <template v-else>{{ "" }}</template>
    </template>

    <template #year-header="{ column }">
      <sort-table-header
        :column
        label="Year"
        type="number"
      />
    </template>

    <template #year-cell="{ row }">
      {{ !row.getIsGrouped() ? row.original.year : "" }}
    </template>

    <template #round-header="{ column }">
      <sort-table-header
        :column
        label="Round"
        type="alpha"
      />
    </template>

    <template #round-cell="{ row }">
      <div
        v-if="!row.getIsGrouped()"
        :class="{ 'text-success font-semibold uppercase': row.original.round === 'Win' }"
      >
        {{ row.original.round }}
      </div>
    </template>
  </u-table>
</template>
