<script setup lang="ts">
useHead({ title: "Players", meta: [{ name: "description", content: "Players who have played in the Open Era" }] })

const route = useRoute("players")
const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()
const updateRouteQuery = useRouteQueryUpdater()

const { countries, pending: countriesPending } = useCountryList()

const count = ref(0)
const players = ref<Array<PlayerListType>>([])
const canLoadMore = ref(false)
const offset = ref(0)

const { pending, execute, refresh } = await useAsyncData(
  () => `players-${JSON.stringify(route.query)}`,
  async () => {
    let query = supabase
      .from("player_list_view")
      .select("*", { count: "exact", head: false })
      .range(offset.value, offset.value + 29)

    if (route.query.tour) query = query.eq("tour", route.query.tour as TourType)

    if (route.query.country) query = query.eq("country->>id", route.query.country as string)

    if (route.query.turned_pro) query = query.gte("turned_pro", Number(route.query.turned_pro))

    if (route.query.retired) query = query.gte("retired", Number(route.query.retired))

    if (route.query.first_tournament) query.gte("first_tournament", Number(route.query.first_tournament))

    if (route.query.last_tournament) query.lte("last_tournament", Number(route.query.last_tournament))

    if (route.query.sort) {
      const [field, direction] = (route.query.sort as string).split("-")

      if (field === "name") {
        query = query.order("last_name", { ascending: direction === "asc" })
        query = query.order("first_name", { ascending: direction === "asc" })
      } else {
        query = query.order(field as string, { ascending: direction === "asc" })
      }
    } else {
      query = query.order("last_name", { ascending: true })
      query = query.order("first_name", { ascending: true })
    }

    const { data, count: countData, error } = await query

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    set(canLoadMore, players.value.length + data.length < (countData || 0))

    set(players, players.value.concat(data as unknown as Array<PlayerListType>))
    set(count, countData || 0)

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

watchDeep(
  [
    () => route.query.tour,
    () => route.query.turned_pro,
    () => route.query.retired,
    () => route.query.first_tournament,
    () => route.query.last_tournament,
    () => route.query.country
  ],
  () => {
    set(players, [])
    set(offset, 0)
  }
)

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
            :model-value="<TourType>route.query.tour"
            @update:model-value="updateRouteQuery('tour', $event)"
            :items="['ATP', 'WTA']"
            placeholder="Filter by Tour"
            :icon="ICONS.tour"
            highlight
          />

          <u-select-menu
            :model-value="<string>route.query.country"
            @update:model-value="updateRouteQuery('country', $event)"
            :items="countries"
            value-key="id"
            label-key="name"
            placeholder="Filter by Country"
            :icon="ICONS.globe"
            clear
            highlight
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
          @load-more="loadMore"
          @refresh="refresh"
          :count
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
