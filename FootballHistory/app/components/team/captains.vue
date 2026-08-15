<script setup lang="ts">
import { DevOnly, LazyTeamCaptainCreate } from "#components"
import { formatDate } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { type QueryData } from "@supabase/supabase-js"

const route = useRoute("team")
const supabase = useSupabaseClient()

const captainQuery = () =>
  supabase
    .from("team_captain")
    .select(
      `
        *,
        ...player(aka, ...people(*, nationality:country!nationality_country_id(*)))
      `
    )
    .eq("team_id", route.params.id)

type CaptainType = QueryData<ReturnType<typeof captainQuery>>[number]

const {
  data: captains,
  pending,
  refresh
} = await useAsyncData(
  () => `team-${route.params.id}-captains`,
  async () => {
    const { data, error } = await captainQuery()

    if (error || !data) {
      console.error("Error fetching captains:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<CaptainType>> = [
  {
    accessorKey: "full_name",
    header: "Full Name",
    footer: () => h(DevOnly, {}, () => h(LazyTeamCaptainCreate, { hydrateOnIdle: true, onRefresh: refresh }))
  },
  { accessorKey: "dob", header: "Date of Birth" },
  { accessorKey: "nationality.name", header: "Nationality" },
  { accessorKey: "captain_type", header: "Title" },
  { id: "dates", header: "Dates" }
]
</script>

<template>
  <u-table
    :data="captains"
    :columns
    :loading="pending"
    sticky
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        title="No captains found"
        @refresh="refresh"
        class="mx-2"
      />
    </template>

    <template #dates-cell="{ row }">
      <div v-if="row.original.start_date">
        {{ formatDate(row.original.start_date, row.original.end_date) }}
      </div>
    </template>
  </u-table>
</template>
