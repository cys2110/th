<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import type { QueryData } from "@supabase/supabase-js"

const route = useRoute("player")
const supabase = useSupabaseClient()

const teamsQuery = () =>
  supabase
    .from("player_team_tenure")
    .select("*, team!team_id(name, short_name, logo_url), parent_team:team!parent_team_id(name, short_name, logo_url)")
    .eq("player_id", route.params.id)
    .order("start_date", { ascending: true })
    .order("start_year", { ascending: true })

type Team = QueryData<ReturnType<typeof teamsQuery>>[number]

const {
  data: teams,
  pending,
  refresh
} = await useAsyncData(
  () => `player-teams-${route.params.id}`,
  async () => {
    const { data, error } = await teamsQuery()

    if (error || !data) {
      console.error("Error fetching player teams:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<Team>> = [
  { id: "name", accessorFn: row => row.team?.short_name || row.team?.name, header: "Team" },
  { accessorKey: "relationship_type" },
  { id: "start", accessorFn: row => row.start_date || row.start_year },
  { id: "end", accessorFn: row => row.end_date || row.end_year },
  { id: "parent_team", accessorFn: row => row.parent_team?.short_name || row.parent_team?.name }
]
</script>

<template>
  <u-table
    :data="teams"
    :columns
    :loading="pending"
    sticky
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        title="No teams found"
        icon="fluent:people-team-delete-20-regular"
      />
    </template>

    <!-- <template #name-cell="{ row }">
            <u-user
              :name="row.original.name"
              :avatar="{ src: row.original.logo_url || '', loading: 'lazy', icon: ICONS.team }"
            />
          </template>

          <template #national_association_name-cell="{ row }">
            <u-link
              :to="{
                name: 'federation',
                params: { id: row.original.national_association!.id, name: kebabCase(row.original.national_association!.name) }
              }"
              class="hover-link primary-link"
            >
              {{ row.original.national_association?.name }}
            </u-link>
          </template> -->
  </u-table>
</template>
