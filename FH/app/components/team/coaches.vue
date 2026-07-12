<script setup lang="ts">
import { formatDate } from "#imports"
import { DevOnly, LazyTeamCoachCreate } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type QueryData } from "@supabase/supabase-js"

const props = defineProps<{ federationId: string | null }>()

const route = useRoute("team")
const supabase = useSupabaseClient()

const coachQuery = () =>
  supabase
    .from("people")
    .select(
      `
        *,
        nationality:country!nationality_country_id(*),
        birth_country:country!birth_country_id(*),
        tenure:team_coach_tenure!inner(*)
      `
    )
    .eq("team_coach_tenure.team_id", route.params.id)

type CoachType = QueryData<ReturnType<typeof coachQuery>>[number]

const {
  data: coaches,
  pending,
  refresh
} = await useAsyncData(
  () => `team-${route.params.id}-coaches`,
  async () => {
    const { data, error } = await coachQuery()

    if (error || !data) {
      console.error("Error fetching coaches:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<CoachType>> = [
  {
    accessorKey: "full_name",
    header: "Full Name",
    footer: () => h(DevOnly, {}, () => h(LazyTeamCoachCreate, { hydrateOnIdle: true, federationId: props.federationId, onRefresh: refresh }))
  },
  { accessorKey: "dob", header: "Date of Birth" },
  { accessorKey: "nationality.name", header: "Nationality" },
  { accessorKey: "birth_country.name", header: "Birth Place" },
  { accessorKey: "tenure", header: "Tenure" }
]
</script>

<template>
  <u-table
    :data="coaches"
    :columns
    :loading="pending"
    sticky
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        title="No coaches found"
        class="mx-2"
      />
    </template>

    <template #tenure-cell="{ row }">
      <div
        v-for="tenure in row.original.tenure"
        :key="tenure.id"
      >
        <span>{{ tenure.title }}</span>
        <span v-if="tenure.start_date"> - {{ formatDate(tenure.start_date, tenure.end_date) }}</span>
      </div>
    </template>
  </u-table>
</template>
