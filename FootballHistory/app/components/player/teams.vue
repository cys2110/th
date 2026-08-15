<script setup lang="ts">
import { formatDate, ICONS, PLAYER_TEAM_RELATIONSHIP_TYPE_MAPPING } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import type { QueryData } from "@supabase/supabase-js"
import { kebabCase } from "lodash"

const route = useRoute("player")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()
const toast = useToast()

const teamsQuery = () =>
  supabase
    .from("player_team_tenure")
    .select("*, team!team_id(name, short_name, logo_url), parent_team:team!parent_team_id(name, short_name, logo_url)")
    .eq("player_id", route.params.id)
    .order("start_date", { ascending: true })

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
  { accessorKey: "relationship_type", header: "" },
  { id: "dates", header: "Dates" }
]

const handleCopy = async (id: string) => {
  try {
    await navigator.clipboard.writeText(id)

    toast.add({
      title: "ID copied",
      color: "success",
      icon: ui.icons.success
    })
  } catch (error) {
    console.error("Error copying ID:", error)
  }
}
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
        @refresh="refresh"
        class="mx-2"
      />
    </template>

    <template #name-cell="{ row }">
      <div class="flex items-center gap-2">
        <u-user
          :name="row.original.team.short_name || row.original.team.name"
          :avatar="{ src: row.original.team.logo_url || '', loading: 'lazy', icon: ICONS.team }"
          :to="{ name: 'team', params: { id: row.original.team_id, name: kebabCase(row.original.team.name) } }"
        />
        <dev-only>
          <u-button
            :icon="ui.icons.copy"
            @click="handleCopy(row.original.id)"
          />
        </dev-only>
      </div>
    </template>

    <template #relationship_type-cell="{ row }">
      <div class="flex justify-center items-center gap-2">
        <span>{{ PLAYER_TEAM_RELATIONSHIP_TYPE_MAPPING[row.original.relationship_type] }}</span>
        <u-user
          v-if="row.original.parent_team && row.original.parent_team_id"
          :name="row.original.parent_team.short_name || row.original.parent_team.name"
          :avatar="{ src: row.original.parent_team.logo_url || '', loading: 'lazy', icon: ICONS.team }"
          :to="{ name: 'team', params: { id: row.original.parent_team_id, name: kebabCase(row.original.parent_team.name) } }"
        />
      </div>
    </template>

    <template #dates-cell="{ row }">
      {{ row.original.start_date ? formatDate(row.original.start_date, row.original.end_date) : "—" }}
    </template>
  </u-table>
</template>
