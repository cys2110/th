<script setup lang="ts">
useHead({ title: "Tournaments" })

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const { results, loading, searchTerm } = useTournamentSearch()

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

const tournaments = ref<Array<TournamentInterface>>([])
const count = ref(0)
const canLoadMore = ref(false)

const { pending, execute, refresh } = await useAsyncData(
  "tournaments",
  async () => {
    const query = supabase
      .from("tournaments")
      .select("*", { count: "exact" })
      .range(offset.value, offset.value + 29)

    if (filters.value.tournaments.length)
      query.in(
        "id",
        filters.value.tournaments.map(v => v.id)
      )

    if (filters.value.tours.length) query.contains("tours", filters.value.tours)

    if (filters.value.established) query.gte("established", filters.value.established)

    if (filters.value.abolished) query.lte("abolished", filters.value.abolished)

    if (sorting.value.length) sorting.value.forEach(s => query.order(s.field, { ascending: s.direction }))

    query.order("id", { ascending: true }) // Add sorting for consistent ordering

    const { data, count: countData, error } = await query

    if (error || !data) {
      console.error("Error fetching tournaments:", error)
      return []
    }

    set(canLoadMore, data.length + tournaments.value.length < (countData || 0))
    set(count, countData || 0)

    tournaments.value = tournaments.value.concat(data)

    return data
  },
  {
    immediate: false,
    lazy: true,
    default: () => [],
    watch: [offset]
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
  <u-container>
    <u-page>
      <u-page-header
        title="Tournaments"
        :ui="{ description: 'flex justify-end gap-4' }"
      >
        <template #links>
          <dev-only>
            <u-field-group class="w-fit">
              <u-button
                :icon="icons.reload"
                @click="refresh()"
              />

              <lazy-tournament-create hydrate-on-idle />
            </u-field-group>
          </dev-only>
        </template>

        <template
          #description
          v-if="!viewModeStore.isTableView"
        >
          <u-select
            v-model="filters.tours"
            :items="[...TOUR_OPTIONS]"
            placeholder="Filter by Tour"
            multiple
            :icon="ICONS.tour"
            highlight
          />

          <u-select-menu
            v-model="filters.tournaments"
            :items="results"
            placeholder="Filter by Tournament"
            multiple
            :icon="ICONS.trophy"
            clear
            :loading
            v-model:search-term="searchTerm"
            highlight
          />
        </template>
      </u-page-header>

      <u-page-body>
        <tournaments-table
          v-if="viewModeStore.isTableView"
          :tournaments
          :pending
          :can-load-more
          :sorting
          :count
          @load-more="loadMore"
          @handle-sorting="handleSorting"
          v-model:filters="filters"
          @refresh="refresh"
        />

        <tournaments-grid
          v-else
          :tournaments
          :pending
          :can-load-more
          @load-more="loadMore"
          @refresh="refresh"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
