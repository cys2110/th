<script setup lang="ts">
const {
  params: { id }
} = useRoute("tournament")

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const key = computed(() => `${id}-winners`)

const { data: editions, pending } = await useAsyncData<Array<LaverWinnerInterface | CountryWinnerInterface | EditionWinnerInterface>>(
  key,
  async () => {
    // Laver Cup
    if (id === "9210") {
      const { data, error } = await supabase.from("editions").select("id, year, events(id,entries(*))").eq("tournament_id", Number(id))

      if (error || !data) {
        console.error("Error fetching editions:", error)
        return []
      }

      return data.map(
        edition =>
          ({
            id: edition.id,
            year: edition.year,
            laverWinner: edition.events?.[0]?.entries.find(entry => entry.points && entry.points > 12) || []
          }) as unknown as LaverWinnerInterface
      )
    } else if (COUNTRY_DRAWS.includes(id)) {
      // Country Draws (e.g., Davis Cup, ATP Cup, United Cup, Billie Jean King Cup)
      const { data, error } = await supabase.rpc("get_country_winners", { tournament_id: Number(id) })

      if (error || !data) {
        console.error("Error fetching editions:", error)
        return []
      }

      return data as unknown as Array<CountryWinnerInterface>
    } else {
      // All other tournaments
      const { data, error } = await supabase.rpc("get_elimination_winners", { tournament_id: Number(id) })

      if (error || !data) {
        console.error("Error fetching editions:", error)
        return []
      }

      return data as unknown as Array<EditionWinnerInterface>
    }
  },
  { default: () => [] }
)
</script>

<template>
  <tournament-winners-table
    v-if="viewModeStore.isTableView"
    :events="editions"
    :pending
  />

  <tournament-winners-grid
    v-else
    :editions
    :pending
  />
</template>
