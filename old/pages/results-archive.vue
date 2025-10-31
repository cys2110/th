<script setup lang="ts">
useHead({ title: "Results Archive" })
const { viewMode } = useViewMode()

const skip = ref(0)
const events = ref<EventInterface[]>([])

const filters = reactive<EventFiltersType>({
  tours: [],
  tournaments: [],
  levels: [],
  categories: [],
  dateRange: { start: undefined, end: undefined },
  surfaces: [],
  venues: [],
  countries: [],
  supervisors: [],
  umpires: [],
  environment: undefined,
  years: []
})
const resetFilters = () => {
  filters.tours = []
  filters.tournaments = []
  filters.levels = []
  filters.categories = []
  filters.dateRange = { start: undefined, end: undefined }
  filters.surfaces = []
  filters.venues = []
  filters.countries = []
  filters.supervisors = []
  filters.umpires = []
  filters.environment = undefined
  filters.years = []
}

const reset = () => {
  set(skip, 0)
  set(events, [])
}

watchDeep(filters, reset)

const { data, status, execute } = await useFetch<{ count: number; events: EventInterface[] }>("/api/results-archive", {
  key: () => `events-${JSON.stringify(get(filters))}-${get(skip)}`,
  query: {
    skip,
    filters
  },
  default: () => ({ count: 0, events: [] }),
  onResponse: ({ response }) => {
    set(events, [...get(events), ...(response._data?.events || [])])
  },
  lazy: true,
  immediate: false
})

execute()
</script>

<template>
  <div class="w-full">
    <archive-cards
      v-if="viewMode === 'cards'"
      :events
      v-model:skip="skip"
      :resetFilters
      :status
      :count="data.count"
      v-model:filters="filters"
    />

    <archive-table
      v-else
      :events
      v-model:skip="skip"
      :resetFilters
      :status
      :count="data.count"
      v-model:filters="filters"
    />
  </div>
</template>
