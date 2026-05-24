<script setup lang="ts">
const {
  params: { id }
} = useRoute("tournament")

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const key = computed(() => `${id}-winners`)

const {
  data: editions,
  pending,
  refresh
} = await useAsyncData<Array<LaverWinnerInterface | CountryWinnerInterface | EditionWinnerInterface>>(
  key,
  async () => {
    // Laver Cup
    if (id === "9210") {
      const { data, error } = await supabase
        .from("editions")
        .select("id, year, events(id, entries(*))")
        .eq("tournament_id", Number(id))
        .order("year", { ascending: true })

      if (error || !data) {
        console.error("Error fetching Laver Cup winners")
        return [] as Array<LaverWinnerInterface>
      }

      return data?.map(edition => ({
        id: edition.id,
        year: edition.year,
        team_name: edition.events[0]?.entries.find(entry => entry.points && entry.points > 12)?.team_name || null
      })) as Array<LaverWinnerInterface>
    } else if (COUNTRY_DRAWS.includes(id)) {
      // Country draws (e.g., Davis Cup, ATP Cup, United Cup, Billie Jean King Cup)
      const { data, error } = await supabase
        .from("country_winners")
        .select("*, countries(*)")
        .eq("tournament_id", Number(id))
        .order("year", { ascending: true })

      if (error || !data) {
        console.error("Error fetching country draw winners")
        return [] as Array<CountryWinnerInterface>
      }

      return data.map(edition => ({
        id: edition.id,
        year: edition.year,
        country: edition.countries
      })) as Array<CountryWinnerInterface>
    } else {
      // All other tournaments
      const { data, error } = await supabase
        .from("elimination_winners")
        .select("*")
        .eq("tournament_id", Number(id))
        .order("year", { ascending: true })
        .order("id", { ascending: true })

      if (error || !data) {
        console.error("Error fetching tournament winners")
        return [] as Array<EditionWinnerInterface>
      }
      return data as unknown as Array<EditionWinnerInterface>
    }
  },
  { default: () => [] as Array<LaverWinnerInterface | CountryWinnerInterface | EditionWinnerInterface> }
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
    :editions
    :pending
    @refresh="refresh"
  />
</template>
