<script setup lang="ts">
const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()
const tournamentStore = useTournamentStore()

const { data: editions, pending } = await useAsyncData<Array<EditionWinnersInterface>>(
  "editions",
  async () => {
    let editions: Array<EditionWinnersInterface>

    if (tournamentStore.id === "9210") {
      const { data, error } = await supabase
        .from("editions")
        .select(
          `
            id,
            year,
            events(entries(*))
        `
        )
        .eq("tournament", Number(tournamentStore.id))

      if (error || !data) {
        console.error("Error fetching editions:", error)
        return []
      }

      editions = data.map(edition => ({
        id: edition.id,
        year: edition.year,
        laverWinner: edition.events[0]?.entries.find(entry => entry.points && entry.points > 12)
      })) as Array<EditionWinnersInterface>
    } else if (COUNTRY_DRAWS.includes(tournamentStore.id)) {
      const { data, error } = await supabase.rpc("get_country_winners", { tournament_id: Number(tournamentStore.id) })

      if (error || !data) {
        console.error("Error fetching editions:", error)
        return []
      }

      editions = data as unknown as Array<EditionWinnersInterface>
    } else {
      const { data, error } = await supabase.rpc("get_elimination_winners", { tournament_id: Number(tournamentStore.id) })

      if (error || !data) {
        console.error("Error fetching editions:", error)
        return []
      }

      editions = data as unknown as Array<EditionWinnersInterface>
    }

    return editions
  },
  { default: () => [] }
)
</script>

<template>
  <div>
    <dev-only>
      <div class="flex justify-end">
        <edition-create />
      </div>
    </dev-only>

    <tournament-winners-table
      v-if="viewModeStore.isTableView"
      :editions
      :pending
    />

    <tournament-winners-grid
      v-else
      :editions
      :pending
    />
  </div>
</template>
