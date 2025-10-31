<script setup lang="ts">
defineProps<{
  tournament: TournamentInterface
  refresh: () => void
}>()

const { viewMode } = useViewMode()
const selectedTab = defineModel<string>()
const {
  params: { id }
} = useRoute("tournament")

const skip = ref(0)
const editions = ref<EditionInterface[]>([])

const filters = reactive<Partial<FiltersInterface>>({
  years: [],
  tours: [],
  winners: []
})

const resetFilters = () => {
  filters.tours = []
  filters.years = []
  filters.winners = []
}

const reset = () => {
  set(skip, 0)
  set(editions, [])
}

watchDeep(filters, reset, { immediate: false })

const { data, status, execute } = await useFetch<{ count: number; editions: EditionInterface[] }>("/api/editions", {
  query: { skip, filters, id },
  default: () => ({ count: 0, editions: [] }),
  onResponse: ({ response }) => {
    set(editions, [...get(editions), ...(response._data?.editions || [])])
  },
  lazy: true,
  immediate: false
})
execute()
</script>

<template>
  <tournaments-winners-cards
    v-if="viewMode === 'cards'"
    :tournament
    v-model="selectedTab"
    v-model:skip="skip"
    v-model:filters="filters"
    :editions
    :status
    :count="data.count"
    :resetFilters
    :refresh
  />

  <tournaments-winners-table
    v-else
    :tournament
    v-model="selectedTab"
    v-model:skip="skip"
    v-model:filters="filters"
    :editions
    :status
    :count="data.count"
    :resetFilters
    :refresh
  />
</template>
