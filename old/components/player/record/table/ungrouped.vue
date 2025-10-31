<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const { results, status, firstName, lastName } = defineProps<{
  results: RecordAPIType
  status: APIStatusType
  tour: TourType
  firstName?: string
  lastName?: string
}>()

const singlesResults = computed(() => {
  return results.singles.flatMap(singles => singles.resultsPerTid.map(s => ({ ...s })))
})

const doublesResults = computed(() => {
  return results.doubles.flatMap(doubles => doubles.resultsPerTid.map(d => ({ ...d })))
})

const columns: TableColumn<RecordInterface>[] = [
  { id: "tournament", accessorKey: "tournament.name" },
  { accessorKey: "year" },
  { accessorKey: "number" }
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-200">
    <u-badge
      color="singles"
      label="Singles"
      size="xl"
      :ui="{ label: 'mx-auto' }"
    />
    <u-badge
      color="doubles"
      label="Doubles"
      size="xl"
      :ui="{ label: 'mx-auto' }"
    />

    <u-table
      :data="singlesResults"
      :columns
      :loading="status === 'pending'"
      sticky
      :ui="{
        root: 'scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent'
      }"
      :empty="`No singles records found for ${firstName || ''} ${lastName || ''}`"
    >
      <template #tournament-header="{ column }">
        <sort-table-header
          :column
          label="Tournament"
          type="alpha"
        />
      </template>

      <template #tournament-cell="{ row }">
        <u-link
          :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
          class="hover-link font-semibold"
        >
          {{ row.original.tournament.name }}
        </u-link>
      </template>

      <template #year-header="{ column }">
        <sort-table-header
          :column
          label="Year"
          type="number"
        />
      </template>

      <template #number-header="{ column }">
        <sort-table-header
          :column
          label="Round"
          type="alpha"
        />
      </template>

      <template #number-cell="{ row }">
        <div :class="{ 'text-success font-semibold uppercase': row.original.round === 'Win' }">
          {{ row.original.round }}
        </div>
      </template>
    </u-table>

    <u-table
      :data="doublesResults"
      :columns
      :loading="status === 'pending'"
      sticky
      :ui="{
        root: 'scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent'
      }"
      :empty="`No doubles records found for ${firstName || ''} ${lastName || ''}`"
    >
      <template #tournament-header="{ column }">
        <sort-table-header
          :column
          label="Tournament"
          type="alpha"
        />
      </template>

      <template #tournament-cell="{ row }">
        <u-link
          :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
          class="hover-link font-semibold"
        >
          {{ row.original.tournament.name }}
        </u-link>
      </template>

      <template #year-header="{ column }">
        <sort-table-header
          :column
          label="Year"
          type="number"
        />
      </template>

      <template #number-header="{ column }">
        <sort-table-header
          :column
          label="Round"
          type="alpha"
        />
      </template>

      <template #number-cell="{ row }">
        <div :class="{ 'text-success font-semibold uppercase': row.original.round === 'Win' }">
          {{ row.original.round }}
        </div>
      </template>
    </u-table>
  </div>
</template>
