<script setup lang="ts">
import { LazyEditionSeedsCreate, UButton, UFieldGroup } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()
const toast = useToast()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const updatedSeeds = ref<Record<string, number | null>>({})
const isSaving = ref(false)

const key = computed(() => `${edId}-seeds`)

const {
  data: seeds,
  pending,
  refresh
} = await useAsyncData<Array<SeedInterface>>(
  key,
  async () => {
    const { data, error } = await supabase
      .from("seeds")
      .select(
        "*, events!inner(edition_id), entries(withdrawals(id, draw), player_entry_mapping(countries(*), players(id, full_name, first_name, last_name, tour)))"
      )
      .eq("events.edition_id", Number(edId))
      .order("event_id", { ascending: true })
      .order("draw", { ascending: true })
      .order("match_type", { ascending: true })
      .order("seed", { ascending: true })

    if (error || !data) {
      console.error("Error fetching seeds:", error)
      return []
    }

    return data.map(
      seed =>
        ({
          id: seed.id,
          seed: seed.seed,
          draw: seed.draw,
          match_type: seed.match_type,
          rank: seed.rank,
          tour: seed.entries.player_entry_mapping[0]?.players.tour,
          withdrew: !!seed.entries.withdrawals.find(w => w.draw === seed.draw),
          team: seed.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            full_name: entry.players.full_name,
            country: entry.countries
          }))
        }) as SeedInterface
    )
  },
  { default: () => [] }
)

const columns: Array<TableColumn<SeedInterface>> = [
  { id: "checkbox" },
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { accessorKey: "draw" },
  { accessorKey: "seed", header: "Seed" },
  {
    id: "team",
    accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`),
    ...(isAdmin.value && {
      footer: () => h(UFieldGroup, { class: "w-fit" }, () => [h(LazyEditionSeedsCreate, { hydrateOnIdle: true, onRefresh: refresh })])
    })
  },
  { accessorKey: "rank", header: "Rank" }
]
</script>

<template>
  <div class="flex justify-end mb-4">
    <edition-seeds-chart
      :seeds
      :pending
    />
  </div>
</template>
