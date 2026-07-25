<script setup lang="ts">
import { ICONS, POSITION_GROUP_MAPPING, POSITION_GROUPS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import type { QueryData } from "@supabase/supabase-js"
import { deburr, kebabCase } from "lodash"
import { set } from "@vueuse/core"

useHead({ title: "Players" })

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute("players")
const { ui } = useAppConfig()

const countryQuery = computed(() => {
  const country = route.query.country
  const values = Array.isArray(country) ? country : [country]

  return values.filter((value): value is string => typeof value === "string")
})

const teamQuery = computed(() => {
  const team = route.query.team
  const values = Array.isArray(team) ? team : [team]

  return values.filter((value): value is string => typeof value === "string")
})

const positionQuery = computed(() => {
  const position = route.query.position
  const values = Array.isArray(position) ? position : [position]

  return values.filter((value): value is string => typeof value === "string")
})

const updateRouteQuery = useRouteQueryUpdater()
const countryList = useCountryList()
const teamList = useTeamList()
const searchTerm = ref()

const playersQuery = () => {
  const query = supabase
    .from("player_details")
    .select("*, country!nationality_country_id(name)", { count: "exact" })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset.value, offset.value + 29)

  if (positionQuery.value.length) query.in("current_position", positionQuery.value as any[])
  if (countryQuery.value.length) query.in("nationality_country_id", countryQuery.value)
  if (teamQuery.value.length) query.in("team_id", teamQuery.value)
  if (searchTerm.value) query.ilike("search_text", `%${deburr(searchTerm.value)}%`)

  return query
}

type PlayerType = QueryData<ReturnType<typeof playersQuery>>[number]

const table = useTemplateRef("table")
const count = ref(0)
const players = ref<Array<PlayerType>>([])
const canLoadMore = ref(false)
const offset = ref(0)

const { pending, execute, refresh } = await useAsyncData(
  () => `players-${JSON.stringify(route.query)}-${offset.value}`,
  async () => {
    const { data, count: playerCount, error } = await playersQuery()

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    players.value = [...players.value, ...data]
    count.value = playerCount || 0

    canLoadMore.value = players.value.length < count.value

    return data
  },
  { default: () => [], lazy: true, immediate: false, watch: [offset] }
)

execute()

watchDeep([() => route.query.position, () => route.query.team, () => route.query.country, () => searchTerm.value], () => {
  set(players, [])
  if (offset.value === 0) {
    execute()
  } else {
    set(offset, 0)
  }
})

const loadMore = () => {
  if (pending.value) return

  offset.value += 30
}

const columns: Array<TableColumn<PlayerType>> = [
  { id: "name", accessorFn: row => row.aka || row.full_name, header: "Name" },
  { accessorKey: "icon", header: "Country" },
  { accessorKey: "team_name", header: "Current Team" },
  { accessorKey: "current_position", header: "Current Position" }
]

const handleSelectRow = (_e: Event, row: TableRow<PlayerType>) => {
  const { id, full_name } = row.original

  router.push({
    name: "player",
    params: { id: id!, name: kebabCase(full_name!) }
  })
}

onMounted(() => {
  useInfiniteScroll(table.value?.$el, () => loadMore(), {
    distance: 10,
    canLoadMore: () => canLoadMore.value
  })
})
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header title="Players">
        <template #links>
          <dev-only>
            <lazy-player-create
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only>
        </template>
      </u-page-header>

      <template #left>
        <u-page-aside :ui="{ container: 'space-y-3' }">
          <form-input
            v-model="searchTerm"
            placeholder="Search"
            :icon="ui.icons.search"
          />

          <u-input-menu
            :model-value="countryQuery"
            :items="countryList.countries.value"
            :loading="countryList.pending.value"
            placeholder="Country"
            value-key="id"
            label-key="name"
            multiple
            @update:model-value="updateRouteQuery('country', $event as string[])"
            :icon="ICONS.globe"
            class="w-full"
          />

          <u-input-menu
            :model-value="teamQuery"
            @update:model-value="updateRouteQuery('team', $event as string[])"
            :loading="teamList.pending.value"
            clear
            placeholder="Team"
            :items="<any>teamList.teams.value"
            value-key="id"
            label-key="aka"
            description-key="nickname"
            multiple
            :icon="ICONS.team"
            :filter-fields="['name', 'short_name', 'nickname']"
            class="w-full"
          >
            <template #item-leading="{ item }">
              <u-avatar
                :src="item.logo_url || ''"
                loading="lazy"
                :icon="ICONS.team"
              />
            </template>
          </u-input-menu>

          <u-input-menu
            :model-value="positionQuery"
            :items="POSITION_GROUPS"
            placeholder="Position"
            value-key="value"
            multiple
            @update:model-value="updateRouteQuery('position', $event as string[])"
            class="w-full"
          />
        </u-page-aside>
      </template>

      <u-page-body>
        <u-table
          ref="table"
          :data="players"
          :columns
          :loading="pending"
          sticky
          @select="handleSelectRow"
        >
          <template #loading>
            <loading-icon />
          </template>

          <template #empty>
            <empty
              title="No players found"
              icon="fluent:people-team-delete-20-regular"
            />
          </template>

          <template #name-cell="{ row }">
            <div>
              <div>{{ row.original.aka || row.original.full_name }}</div>
              <div v-if="row.original.aka">{{ row.original.full_name }}</div>
            </div>
          </template>

          <template #icon-cell="{ row }">
            <div class="flex justify-center items-center gap-1">
              <u-icon :name="row.original.icon" />
              {{ row.original.country?.name }}
            </div>
          </template>

          <template #team_name-cell="{ row }">
            <div class="flex justify-center">
              <u-user
                v-if="row.original.team_name"
                :name="row.original.team_name"
                :avatar="{ src: row.original.team_logo || '', loading: 'lazy', icon: ICONS.team }"
                :to="{ name: 'team', params: { id: row.original.team_id!, name: kebabCase(row.original.team_name!) } }"
              />
            </div>
          </template>

          <template #current_position-cell="{ row }">
            {{ POSITION_GROUP_MAPPING[row.original.current_position!] }}
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
