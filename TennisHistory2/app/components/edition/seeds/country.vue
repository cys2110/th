<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const {
  params: { edId, year }
} = useRoute("edition")

const tournamentStore = useTournamentStore()
const supabase = useSupabaseClient()

const { data: seeds, pending } = await useAsyncData(
  "country-seeds",
  async () => {
    const { data, error } = await supabase
      .from("seeds")
      .select("seed, ...entries(countries(*))")
      .eq("event_id", `${edId}-Country`)
      .order("seed", { ascending: true })

    if (error || !data) {
      console.error("Error fetching seeds:", error)
      return []
    }

    return data as Array<CountrySeedInterface>
  },
  { default: () => [] }
)

const columns: TableColumn<CountrySeedInterface>[] = [
  { accessorKey: "seed", header: "Seed" },
  { id: "country", header: "Country" }
]
</script>

<template>
  <dashboard-subpanel
    title="Seeds"
    :icon="ICONS.ranking"
  >
    <u-table
      :data="seeds"
      :columns
      :loading="pending"
      sticky
      :ui="{ root: 'max-w-1/2 mx-auto', th: 'text-center', td: 'text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :message="`No seeds found for ${tournamentStore.name} ${year}`"
          :icon="ICONS.trophyOff"
        />
      </template>

      <template #country-cell="{ row }">
        <country-link :country="row.original.countries" />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
