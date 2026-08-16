<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type Tables } from "~/types/database.types"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"
import { LazyEditionCreate, UButton, UFieldGroup } from "#components"

type EliminationWinner = Tables<{ schema: "tennis" }, "elimination_winners">

const route = useRoute("tournament")
const router = useRouter()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

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
      .from("elimination_winners")
      .select("*, entry:entries(player_entry_mapping(country(*),...player(id,...people(full_name))))")
      .eq("tournament_id", route.params.id)
      .order("year", { ascending: true })
      .order("tour", { ascending: true })
      .order("match_type", { ascending: true })

    if (error || !data) {
      console.error("Error fetching winners", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<EliminationWinner>> = [
  {
    id: "edition",
    accessorFn: row => {
      if (row.edition_no) {
        return `${row.year} [${row.edition_no}]`
      } else {
        return row.year
      }
    },
    footer: ({ table }) => {
      const count = table.getFilteredRowModel().rows.length
      return `${count.toLocaleString()} edition${count === 1 ? "" : "s"}`
    }
  },
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  {
    accessorKey: "entry",
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, {}, () => [
          h(UButton, { icon: ui.icons.reload, onClick: () => refresh() }),
          h(LazyEditionCreate, { hydrateOnIdle: true })
        ])
      }
    }
  }
]

const columnVisibility = ref({
  tour: tournamentStore.tours.length > 1
})

const handleSelectRow = (e: Event, row: TableRow<EliminationWinner>) => {
  router.push({
    name: "edition",
    params: { ...route.params, year: row.original.year!, edition_no: row.original.edition_no || 0 }
  })
}
</script>

<template>
  <u-table
    :data="editions"
    :columns
    :loading="pending"
    sticky
    v-model:column-visibility="columnVisibility"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    @select="handleSelectRow"
    class="max-w-3/4 mx-auto"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.calendarOff"
        :title="`No players have won ${tournamentStore.name}`"
        @refresh="refresh"
        class="mx-2"
      />
    </template>

    <template #year-header="{ column }">
      <table-header
        :column
        sort
        label="Year"
        :icon="ICONS.years"
      />
    </template>
  </u-table>
</template>
