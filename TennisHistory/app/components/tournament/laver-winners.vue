<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { type Tables } from "~/types/database.types"

type LaverCupWinner = Tables<{ schema: "tennis" }, "laver_cup_winners">

const route = useRoute("tournament")
const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()

const {
  data: editions,
  pending,
  refresh
} = await useAsyncData(
  () => `winners-${route.params.id}`,
  async () => {
    const { data, error } = await supabase.schema("tennis").from("laver_cup_winners").select("*").order("year", { ascending: true })

    if (error || !data) {
      console.error("Error fetching Laver Cup winners", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<LaverCupWinner>> = [{ accessorKey: "year" }, { accessorKey: "team_name" }]
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
        title="No team has won the Laver Cup"
        @refresh="refresh"
        class="mx-2"
      />
    </template>
  </u-table>
</template>
