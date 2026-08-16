<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { type Tables } from "~/types/database.types"

type CountryWinner = Tables<{ schema: "tennis" }, "country_winners">

const route = useRoute("tournament")
const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const {
  data: editions,
  pending,
  refresh
} = await useAsyncData(
  () => `winners-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .schema("tennis")
      .from("country_winners")
      .select("*, country(*)")
      .eq("tournament_id", route.params.id)
      .order("year", { ascending: true })

    if (error || !data) {
      console.error("Error fetching winners", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<CountryWinner>> = [{ accessorKey: "year" }, { accessorKey: "country.name" }]
</script>

<template>
  <u-table
    :data="editions"
    :columns
    :loading="pending"
    sticky
    class="max-w-1/2 mx-auto"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.calendarOff"
        :title="`No team has won ${tournamentStore.name}`"
        @refresh="refresh"
        class="mx-2"
      />
    </template>
  </u-table>
</template>
