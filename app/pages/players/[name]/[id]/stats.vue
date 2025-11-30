<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

definePageMeta({ name: "stats" })
const {
  params: { id }
} = useRoute("stats")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

// Filters
const levels = ref([])
const drawType = ref<DrawEnumType>()
const years = ref([])
const surfaces = ref([])

const resetFilters = () => {
  levels.value = []
  drawType.value = undefined
  years.value = []
  surfaces.value = []
}

const { data: stats, status } = await useFetch<PlayerStatsType[]>("/api/players/stats", {
  method: "POST",
  body: {
    id,
    levels,
    drawType,
    years,
    surfaces
  },
  default: () => []
})

const columns: TableColumn<PlayerStatsType>[] = [
  { accessorKey: "stat", header: "" },
  { accessorKey: "value", header: "" }
]
</script>

<template>
  <players-wrapper>
    <template #page-left>
      <players-stats-chart
        :stats="stats.filter(s => s.percent)"
        :levels
        :draw-type
        :years
        :surfaces
      />

      <u-button
        label="Reset Filters"
        :icon="ICONS.noFilter"
        @click="resetFilters"
        block
      />

      <u-checkbox-group
        legend="Levels"
        v-model="levels"
        :items="LEVEL_OPTIONS"
        :ui="{ item: 'ml-3' }"
      />

      <u-radio-group
        legend="Draw"
        v-model="drawType"
        :items="['Main', 'Qualifying']"
        :ui="{ item: 'ml-3' }"
      />

      <u-checkbox-group
        legend="Surfaces"
        v-model="surfaces"
        :items="['Clay', 'Grass', 'Hard', 'Carpet']"
        :ui="{ item: 'ml-3' }"
      />

      <form-input-menu
        v-model="years"
        placeholder="Years"
        :items="ALL_YEARS"
        :icon="ICONS.event"
        multiple
      />
    </template>

    <template
      #header-links
      v-if="mdAndDown"
    >
      <!--Filters for smaller screens-->
      <u-slideover
        v-if="mdAndDown"
        title="Filters"
        class="ml-auto"
      >
        <u-button :icon="ICONS.filter" />

        <template #body>
          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <u-checkbox-group
            legend="Levels"
            v-model="levels"
            :items="LEVEL_OPTIONS"
            :ui="{ item: 'ml-3' }"
          />

          <u-radio-group
            legend="Draw"
            v-model="drawType"
            :items="['Main', 'Qualifying']"
            :ui="{ item: 'ml-3' }"
          />

          <u-checkbox-group
            legend="Surfaces"
            v-model="surfaces"
            :items="['Clay', 'Grass', 'Hard', 'Carpet']"
            :ui="{ item: 'ml-3' }"
          />

          <form-input-menu
            v-model="years"
            placeholder="Years"
            :items="ALL_YEARS"
            :icon="ICONS.event"
            multiple
          />
        </template>
      </u-slideover>
    </template>

    <u-table
      :data="stats"
      :columns
      :loading="status === 'pending'"
      sticky
      :ui="{ root: 'w-fit min-w-1/3 mx-auto', td: 'empty:p-0' }"
    >
      <template #loading>
        <u-icon
          :name="icons.loading"
          class="size-8"
        />
      </template>

      <template #empty>
        <empty
          message="No stats available"
          class="mx-2"
        />
      </template>

      <template #value-cell="{ row }">
        <u-progress
          v-if="row.original.percent"
          v-model="row.original.value"
          :max="100"
          :ui="{
            root: 'min-w-60 md:min-w-sm',
            base: 'bg-Inactive-300 dark:bg-Inactive-800',
            indicator: 'bg-Inactive-600 dark:bg-Inactive-500'
          }"
        >
          <template #status> {{ row.original.value }}% </template>
        </u-progress>
      </template>
    </u-table>
  </players-wrapper>
</template>
