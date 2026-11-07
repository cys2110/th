export const useTournamentSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const tournaments = ref<Array<TournamentType>>([])
  const pending = ref(false)

  const fetchTournaments = async () => {
    set(pending, true)
    set(tournaments, [])

    try {
      const { data, error } = await supabase.schema("tennis").rpc("search_tournament", { search_term: deburr(toValue(searchTerm)) })

      if (error || !data) {
        console.error("Error fetching tournaments:", error)
        return
      }

      set(tournaments, data)
    } finally {
      set(pending, false)
    }
  }

  watch(
    searchTerm,
    () => {
      fetchTournaments()
    },
    { immediate: true }
  )

  return {
    tournaments,
    pending,
    fetchTournaments,
    searchTerm
  }
}
