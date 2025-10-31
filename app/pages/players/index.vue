<script setup lang="ts">
useHead({ title: "Players" })
const { viewMode } = useViewMode()

const skip = ref(0)
const players = ref<PlayerInterface[]>([])

const filters = reactive<Partial<FiltersInterface>>({
  players: [],
  tours: [],
  countries: [],
  min_year: undefined,
  max_year: undefined,
  status: undefined,
  coaches: []
})

const resetFilters = () => {
  filters.players = []
  filters.tours = []
  filters.countries = []
  filters.min_year = undefined
  filters.max_year = undefined
  filters.status = undefined
  filters.coaches = []
}

const reset = () => {
  set(skip, 0)
  set(players, [])
}

watchDeep(filters, reset)

const { data, status, execute, refresh } = await useFetch<{ count: number; players: PlayerInterface[] }>("/api/players", {
  query: {
    skip,
    filters
  },
  default: () => ({ count: 0, players: [] }),
  onResponse: ({ response }) => {
    set(players, [...get(players), ...(response._data?.players || [])])
  },
  lazy: true,
  immediate: false
})

execute()
</script>

<template>
  <div class="w-full">
    <players-cards
      v-if="viewMode === 'cards'"
      :players
      v-model:skip="skip"
      :resetFilters
      :status
      :count="data.count"
      v-model:filters="filters"
      :refresh
    />
    <players-table
      v-else
      :players
      v-model:skip="skip"
      :resetFilters
      :status
      :count="data.count"
      v-model:filters="filters"
      :refresh
    />
  </div>
</template>
