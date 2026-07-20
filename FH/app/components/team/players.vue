<script setup lang="ts">
import { DevOnly, LazyTeamPlayerAdd } from "#components"
import { formatDate } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { type QueryData } from "@supabase/supabase-js"

const route = useRoute("team")
const supabase = useSupabaseClient()

const playerQuery = () =>
  supabase
    .from("player")
    .select(
      `
        ...people(*, nationality:country!nationality_country_id(*)),
        tenure:player_team_tenure!inner(*),
        *
      `
    )
    .eq("player_team_tenure.team_id", route.params.id)

type PlayerType = QueryData<ReturnType<typeof playerQuery>>[number]

const {
  data: players,
  pending,
  refresh
} = await useAsyncData(
  () => `team-${route.params.id}-players`,
  async () => {
    const { data, error } = await playerQuery()

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<PlayerType>> = [
  {
    accessorKey: "full_name",
    header: "Full Name",
    footer: () => h(DevOnly, {}, () => h(LazyTeamPlayerAdd, { hydrateOnIdle: true, onRefresh: refresh }))
  },
  { accessorKey: "dob", header: "Date of Birth" },
  { accessorKey: "nationality.name", header: "Nationality" },
  { accessorKey: "tenure", header: "Tenure" }
]
</script>

<template>
  <u-table
    :data="players"
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

    <template #tenure-cell="{ row }">
      <div
        v-for="tenure in row.original.tenure"
        :key="tenure.id"
      >
        <!-- <span>{{ tenure.title }}</span> -->
        <span v-if="tenure.start_date">{{ formatDate(tenure.start_date, tenure.end_date) }}</span>
      </div>
    </template>
  </u-table>
</template>
