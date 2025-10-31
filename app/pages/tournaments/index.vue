<script setup lang="ts">
useHead({ title: "Tournaments" })
const { viewMode } = useViewMode()

const skip = ref(0)
const tournaments = ref<TournamentInterface[]>([])

const filters = reactive<Partial<FiltersInterface>>({
  abolished: undefined,
  established: undefined,
  tournaments: [],
  tours: []
})

const resetFilters = () => {
  filters.tours = []
  filters.tournaments = []
  filters.established = undefined
  filters.abolished = undefined
}

const reset = () => {
  set(skip, 0)
  set(tournaments, [])
}

watchDeep(filters, reset, { immediate: false })

const { data, status, execute, refresh } = await useFetch<{ count: number; tournaments: TournamentInterface[] }>("/api/tournaments", {
  query: { skip, filters },
  default: () => ({ count: 0, tournaments: [] }),
  onResponse: ({ response }) => {
    set(tournaments, [...get(tournaments), ...(response._data?.tournaments || [])])
  },
  lazy: true,
  immediate: false
})

execute()
</script>

<template>
  <div class="w-full">
    <tournaments-cards
      v-if="viewMode === 'cards'"
      :tournaments
      :status
      v-model:skip="skip"
      v-model:filters="filters"
      :resetFilters
      :count="data.count"
      :refresh
    />
    <tournaments-table
      v-else
      :tournaments
      :status
      v-model:skip="skip"
      v-model:filters="filters"
      :resetFilters
      :count="data.count"
      :refresh
    />
  </div>
</template>
