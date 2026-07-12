<script setup lang="ts">
const route = useRoute("tournament")
const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const {
  data: editions,
  pending,
  refresh
} = await useAsyncData<Array<EditionWinnerType>>(
  () => `winners-${route.params.id}`,
  async () => {
    // Laver Cup
    if (route.params.id === "9210") {
      const { data, error } = await supabase
        .from("editions")
        .select("id, year, end_date, events(id, end_date, entries(*))")
        .eq("tournament_id", Number(route.params.id))
        .order("year", { ascending: true })

      if (error || !data) {
        console.error("Error fetching Laver Cup winners", error)
        return []
      }

      return data.map(edition => {
        const event = edition.events[0]

        return {
          edition_id: edition.id,
          year: edition.year,
          end_date: edition.end_date || event?.end_date!,
          team_name: event?.entries.find(entry => entry.points && entry.points > 12)?.team_name || null
        } as LaverCupWinnerInterface
      })
    } else if (COUNTRY_DRAWS.includes(route.params.id)) {
      const { data, error } = await supabase
        .from("country_winners")
        .select("*, country:countries(*)")
        .eq("tournament_id", Number(route.params.id))
        .order("year", { ascending: true })

      if (error || !data) {
        console.error("Error fetching country draw winners", error)
        return []
      }

      return data as Array<CountryWinnerInterface>
    } else {
      const { data, error } = await supabase
        .from("elimination_winners")
        .select("*")
        .eq("tournament_id", Number(route.params.id))
        .order("year", { ascending: true })
        .order("tournament_id", { ascending: true })

      if (error || !data) {
        console.error("Error fetching tournament winners", error)
        return []
      }

      return data as unknown as Array<EliminationWinnerInterface>
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
    @refresh="refresh"
  />

  <tournament-winners-grid
    v-else
    :editions="editions"
    :pending
    @refresh="refresh"
  />
</template>
