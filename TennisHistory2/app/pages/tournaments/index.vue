<script setup lang="ts">
useHead({ title: "Tournaments" })

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const { results, loading, searchTerm, tournamentFilters } = useTournamentSearch()

const offset = ref(0)

const filters = ref<TournamentFiltersInterface>({
  tours: [],
  tournaments: [],
  established: undefined,
  abolished: undefined
})

const sorting = ref<Array<SortingInterface>>([{ field: "name", direction: true }])

const handleSorting = (field: string) => {
  const currentSort = sorting.value?.find(sort => sort.field === field)

  if (currentSort) {
    if (currentSort.direction) {
      currentSort.direction = false
    } else {
      sorting.value = sorting.value?.filter(sort => sort.field !== field)
    }
  } else {
    sorting.value.push({ field, direction: true })
  }
}

const tournaments = ref<Array<TournamentType>>([])
const canLoadMore = ref(false)

const { pending, execute, refresh } = await useAsyncData(
  "tournaments",
  async () => {
    const query = supabase
      .from("tournaments")
      .select("*", { count: "exact" })
      .range(offset.value, offset.value + 29)

    if (filters.value.tournaments.length) query.in("id", filters.value.tournaments)

    if (filters.value.tours.length) query.contains("tours", filters.value.tours)

    if (filters.value.established) query.gte("established", filters.value.established)

    if (filters.value.abolished) query.lte("abolished", filters.value.abolished)

    if (sorting.value.length) {
      sorting.value.forEach(s => query.order(s.field, { ascending: s.direction }))
    } else {
      query.order("id", { ascending: true })
    }

    const { data, count, error } = await query

    if (error || !data) {
      console.error("Error fetching tournaments:", error)
      return []
    }

    if (data.length + tournaments.value.length < (count || 0)) {
      set(canLoadMore, true)
    } else {
      set(canLoadMore, false)
    }

    tournaments.value = [...tournaments.value, ...data]

    return data
  },
  {
    immediate: false,
    lazy: true,
    default: () => []
  }
)

execute()

watchDeep([filters, sorting], () => {
  set(tournaments, [])
  set(offset, 0)
  refresh()
})

const loadMore = () => {
  if (pending.value) return

  offset.value += 30
}
</script>

<template>
  <u-container class="xl:max-w-7xl">
    <u-page>
      <u-page-header title="Tournaments">
        <template #links>
          <dev-only>
            <lazy-tournament-create hydrate-on-idle />
          </dev-only>
        </template>

        <template
          #description
          v-if="!viewModeStore.isTableView"
        >
          <u-theme
            :ui="{
              select: {
                base: 'w-fit max-w-1/4'
              },
              selectMenu: {
                base: 'w-fit max-w-3/4'
              }
            }"
          >
            <div class="flex justify-end gap-4">
              <u-select
                v-model="filters.tours"
                :items="[...TOUR_OPTIONS]"
                placeholder="Filter by Tour"
                multiple
                :icon="ICONS.tour"
              />

              <u-select-menu
                placeholder="Filter by Tournament"
                clear
                :items="results"
                v-model="tournamentFilters"
                @update:model-value="filters.tournaments = tournamentFilters.map(t => t.id)"
                multiple
                :icon="ICONS.trophy"
                :loading
                v-model:search-term="searchTerm"
              />
            </div>
          </u-theme>
        </template>
      </u-page-header>

      <u-page-body>
        <tournaments-table
          v-if="viewModeStore.isTableView"
          :tournaments
          :pending
          :can-load-more
          :sorting
          @load-more="loadMore"
          @handle-sorting="handleSorting"
          v-model:filters="filters"
        />

        <tournaments-grid
          v-else
          :tournaments
          :pending
          :can-load-more
          @load-more="loadMore"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
