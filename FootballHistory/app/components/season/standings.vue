<script setup lang="ts">
import { type Database } from "~/types/database.types"
import { type QueryData } from "@supabase/supabase-js"
import type { TableColumn } from "@nuxt/ui"
import { ICONS } from "#imports"
import { kebabCase } from "lodash"

const props = defineProps<{
  seasonId: string
  competitionType: Database["football"]["Enums"]["competition_type"]
}>()

const supabase = useSupabaseClient()

const standingQuery = () =>
  supabase
    .from("standing")
    .select("*, team(name, short_name, logo_url)")
    .eq("season_id", props.seasonId)
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false })

type Standing = QueryData<ReturnType<typeof standingQuery>>[number]

const {
  data: standings,
  pending,
  refresh
} = await useAsyncData(
  () => `standings-${props.seasonId}`,
  async () => {
    const { data, error } = await standingQuery()

    if (error || !data) {
      console.error("Error fetching standings:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<Standing>> = [
  { id: "position", header: "Position" },
  { id: "team", header: "Team" },
  { accessorKey: "played", header: "Pl" },
  { accessorKey: "won", header: "W" },
  { accessorKey: "drawn", header: "D" },
  { accessorKey: "lost", header: "L" },
  { accessorKey: "goals_for", header: "GF" },
  { accessorKey: "goals_against", header: "GA" },
  { accessorKey: "goal_difference", header: "GD" },
  { accessorKey: "points", header: "Pts" }
]
</script>

<template>
  <u-table
    :data="standings"
    :columns
    :loading="pending"
    sticky
    class="scrollbar"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        title="No teams found"
        icon="fluent:people-team-delete-20-regular"
        class="mx-2"
        @refresh="refresh"
      />
    </template>

    <template #position-cell="{ row }">{{ row.index + 1 }}</template>

    <template #team-cell="{ row }">
      <u-user
        :name="row.original.team.short_name || row.original.team.name"
        :avatar="{ src: row.original.team.logo_url || '', loading: 'lazy', icon: ICONS.team }"
        :to="{ name: 'team', params: { id: row.original.team_id, name: kebabCase(row.original.team.name) } }"
      />
    </template>
  </u-table>
</template>
