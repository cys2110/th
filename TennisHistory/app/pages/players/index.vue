<script setup lang="ts">
useHead({ title: "Players" })

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const { results, loading, searchTerm } = usePlayerSearch()

const offset = ref(0)

const filters = ref<PlayerFiltersInterface>({
  tours: [],
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

const players = ref<Array<PlayersItemType>>([])
const canLoadMore = ref(false)

const { data: countries, pending: countriesPending } = await useAsyncData(
  "countries",
  async () => {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching countries:", error)
      return []
    }

    return data.map(country => ({
      ...country,
      icon: getFlagCode(country)
    }))
  },
  { default: () => [] }
)

const { pending, execute, refresh } = await useAsyncData(
  "players",
  async () => {
    let query = supabase
      .from("players")
      .select(
        `
        id,
        first_name,
        last_name,
        tour,
        turned_pro,
        retired,
        country:player_country_mapping!inner(*, countries(*))
      `,
        { count: "exact" }
      )
      .is("country.end_date", null)
      .range(offset.value, offset.value + 29)

    if (filters.value.players.length)
      query = query.in(
        "id",
        filters.value.players.map(v => v.id)
      )

    if (filters.value.tours.length) query = query.in("tour", filters.value.tours)

    if (filters.value.countries.length) query = query.in("country.id", filters.value.countries)

    if (filters.value.turned_pro) query = query.gte("turned_pro", filters.value.turned_pro)

    if (filters.value.retired) query = query.gte("retired", filters.value.retired)

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

    if (data.length + players.value.length < (count || 0)) {
      canLoadMore.value = true
    } else {
      canLoadMore.value = false
    }

    players.value = [
      ...players.value,
      ...data.map(
        player =>
          ({
            ...player,
            country: player.country[0]?.countries as CountryType
          }) as PlayersItemType
      )
    ]

    return data
  },
  {
    lazy: true,
    immediate: false,
    default: () => [],
    watch: [offset]
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
        <template #links>
          <dev-only>
            <lazy-player-create hydrate-on-idle />
          </dev-only>
        </template>

        <template
          #description
          v-if="!viewModeStore.isTableView"
        >
          <u-select
            v-model="filters.tours"
            :items="['ATP', 'WTA']"
            placeholder="Filter by Tour"
            multiple
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
          />
        </template>
      </u-page-header>

      <u-page-body>
        <players-table
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

        <players-grid
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
