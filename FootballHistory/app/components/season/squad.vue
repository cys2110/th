<script setup lang="ts">
import { DevOnly, LazySeasonSquadAdd } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type QueryData } from "@supabase/supabase-js"

const props = defineProps<{ seasonId: string }>()

const route = useRoute("team-season")
const supabase = useSupabaseClient()

const seasonName = computed(() => decodeURIComponent(route.params.season as string))

const squadQuery = (competitionId: string) =>
  supabase
    .from("squad_player")
    .select(
      `
        *,
        ...player(id, aka, ...people(full_name, nationality:country!nationality_country_id(*))),
        season!inner(id, name, competition_id),
        team!inner(id)
      `
    )
    .eq("team_id", route.params.team_id)
    .eq("season.competition_id", competitionId)
    .eq("season.name", seasonName.value)
    .order("shirt_number", { ascending: true })

type SquadType = QueryData<ReturnType<typeof squadQuery>>[number]

const {
  data: squad,
  pending,
  refresh
} = await useAsyncData(
  () => `${route.params.id}-${route.params.season}-${route.params.team_id}-squad`,
  async () => {
    const { data: competitionData, error: competitionError } = await supabase.from("competition").select("id").eq("code", route.params.id).single()

    if (competitionError || !competitionData) {
      console.error("Error fetching competition:", competitionError)
      return []
    }

    const { data, error } = await squadQuery(competitionData.id)

    if (error || !data) {
      console.error("Error fetching squad:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<SquadType>> = [
  {
    accessorKey: "full_name",
    header: "Full Name",
    footer: () => h(DevOnly, {}, () => h(LazySeasonSquadAdd, { hydrateOnIdle: true, onRefresh: refresh, seasonId: props.seasonId }))
  },
  { accessorKey: "nationality.name", header: "Nationality" },
  { accessorKey: "shirt_number", header: "Shirt Number" },
  { accessorKey: "position", header: "Position" }
]
</script>

<template>
  <u-table
    :data="squad"
    :columns
    :loading="pending"
    sticky
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        title="No players found"
        class="mx-2"
      />
    </template>

    <!-- <template #tenure-cell="{ row }">
      <div
        v-for="tenure in row.original.tenure"
        :key="tenure.id"
      >
        <span>{{ tenure.title }}</span>
        <span v-if="tenure.start_date"> - {{ formatDate(tenure.start_date, tenure.end_date) }}</span>
      </div>
    </template> -->
  </u-table>
</template>
