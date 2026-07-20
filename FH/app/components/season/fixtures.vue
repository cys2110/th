<script setup lang="ts">
import { DevOnly, LazyMatchCreate } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type QueryData } from "@supabase/supabase-js"
import { kebabCase } from "lodash"

const props = defineProps<{ seasonId: string }>()

const route = useRoute("season")
const router = useRouter()
const supabase = useSupabaseClient()

const seasonName = computed(() => decodeURIComponent(route.params.season as string))

const fixturesQuery = () =>
  supabase
    .from("match")
    .select(
      `
        *,
        round(*),
        group(*),
        home_team:team!home_team_id(id, name, logo_url, short_name),
        away_team:team!away_team_id(id, name, logo_url, short_name),
        season!inner(name, competition_id)
      `
    )
    .eq("season.competition_id", route.params.id)
    .eq("season.name", seasonName.value)
    .order("match_no", { ascending: true })

type FixtureType = QueryData<ReturnType<typeof fixturesQuery>>[number]

const {
  data: fixtures,
  pending,
  refresh
} = await useAsyncData(
  () => `${route.params.id}-${route.params.season}-fixtures`,
  async () => {
    const { data, error } = await fixturesQuery()

    if (error || !data) {
      console.error("Error fetching fixtures:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<FixtureType>> = [
  {
    accessorKey: "round.name",
    footer: () => h(DevOnly, {}, () => h(LazyMatchCreate, { hydrateOnIdle: true, onRefresh: refresh, seasonId: props.seasonId }))
  },
  {
    accessorKey: "group.name"
  },
  {
    accessorKey: "home_team.name",
    header: ""
  },
  { id: "score", header: "Score" },
  { accessorKey: "away_team.name", header: "" }
  // { accessorKey: "tenure", header: "Tenure" }
]

const handleSelectRow = (_e: Event, row: TableRow<FixtureType>) => {
  const { home_team, away_team, id } = row.original

  router.push({
    name: "match",
    params: { match_id: id, team1: kebabCase(home_team.short_name || home_team.name), team2: kebabCase(away_team.short_name || away_team.name) }
  })
}
</script>

<template>
  <u-table
    :data="fixtures"
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
        title="No fixtures played"
        class="mx-2"
      />
    </template>

    <template #score-cell="{ row }">
      <u-badge :label="`${row.original.home_score}-${row.original.away_score}`" />
    </template>
  </u-table>
</template>
