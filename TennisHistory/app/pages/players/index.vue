<script setup lang="ts">
useHead({ title: "Players" })

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const { results, pending: loading, searchTerm, fetchSearchResults } = usePlayerSearch()
const { countries, pending: countriesPending } = useCountryList()

const filters = ref<PlayerFiltersInterface>({
  players: [],
  countries: []
})

const sorting = ref<Array<SortingInterface>>([
  { field: "last_name", direction: true },
  { field: "first_name", direction: true }
])

const handleSorting = (field: string) => {
  const currentSort = sorting.value?.find(sort => {
    const sortField = field === "name" ? "last_name" : field

    return sort.field === sortField
  })

  const secondarySort = field === "name" ? sorting.value?.find(sort => sort.field === "first_name") : null

  if (currentSort) {
    if (currentSort.direction) {
      currentSort.direction = false

      if (secondarySort) {
        secondarySort.direction = false
      }
    } else {
      sorting.value = sorting.value?.filter(sort => {
        if (field === "name") {
          return sort.field !== "last_name" && sort.field !== "first_name"
        } else {
          return sort.field !== field
        }
      })
    }
  } else {
    if (field === "name") {
      sorting.value.push({ field: "last_name", direction: true }, { field: "first_name", direction: true })
    } else {
      sorting.value.push({ field, direction: true })
    }
  }
}

const players = ref<Array<PlayerListType>>([])
const canLoadMore = ref(false)
const offset = ref(0)

const { pending, execute, refresh } = await useAsyncData(
  "players",
  async () => {
    let query = supabase
      .from("player_list_view")
      .select("*", { count: "exact", head: false })
      .range(offset.value, offset.value + 29)

    const { players: filterPlayers, tour, countries: filterCountries, turned_pro, retired, first_tournament, last_tournament } = filters.value

    if (filterPlayers.length)
      query = query.in(
        "id",
        filterPlayers.map(v => v.id)
      )

    if (tour) query = query.eq("tour", tour)

    if (filterCountries.length) query = query.in("country->>id", filterCountries)

    if (turned_pro) query = query.gte("turned_pro", turned_pro)

    if (retired) query = query.gte("retired", retired)

    if (first_tournament) query.gte("first_tournament", first_tournament)

    if (last_tournament) query.lte("last_tournament", last_tournament)

    if (sorting.value.length) {
      sorting.value.forEach(s => query.order(s.field, { ascending: s.direction }))
    } else {
      query.order("last_name", { ascending: true })
      query.order("first_name", { ascending: true })
    }

    const { data, count, error } = await query

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    set(canLoadMore, players.value.length + data.length < (count || 0))

    set(players, players.value.concat(data as unknown as Array<PlayerListType>))

    return data
  },
  {
    lazy: true,
    immediate: false,
    default: () => [],
    watch: [offset] // triggers when offset changes
  }
)

execute()

watchDeep([filters, sorting], () => {
  set(players, [])
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
        title="Players"
        :ui="{ description: 'flex justify-end gap-4' }"
      >
        <template
          #description
          v-if="!viewModeStore.isTableView"
        >
          <u-select
            v-model="filters.tour"
            :items="['ATP', 'WTA']"
            placeholder="Filter by Tour"
            :icon="ICONS.tour"
            highlight
          />

          <u-select-menu
            v-model="filters.countries"
            :items="countries"
            value-key="id"
            label-key="name"
            placeholder="Filter by Country"
            multiple
            :icon="ICONS.globe"
            clear
            highlight
            class="max-w-1/3"
          />

          <u-select-menu
            v-model="filters.players"
            :items="results"
            placeholder="Filter by Player"
            multiple
            :icon="ICONS.player"
            clear
            highlight
            :loading
            v-model:search-term="searchTerm"
            class="max-w-1/3"
            @update:open="fetchSearchResults"
            label-key="name"
          />
        </template>
      </u-page-header>

      <u-page-body>
        <player-table
          v-if="viewModeStore.isTableView"
          :players
          :pending
          :can-load-more
          :countries
          :countries-pending
          :sorting
          @load-more="loadMore"
          @handle-sorting="handleSorting"
          v-model:filters="filters"
          @refresh="refresh"
        />

        <player-grid
          v-else
          :players
          :pending
          :can-load-more
          @load-more="loadMore"
          @refresh="refresh"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
