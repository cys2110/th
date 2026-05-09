interface SearchResults {
  id: number
  label: string
}

export const useTournamentSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const tournamentFilters = ref<Array<SearchResults>>([])

  const results = ref<Array<SearchResults>>([])

  const loading = ref(false)

  const fetchSearchResults = async () => {
    results.value = []

    set(loading, true)

    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name")
      .ilike("name", `%${toValue(searchTerm)}%`)
      .limit(20)
      .order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching tournaments search results:", error)
      set(loading, false)
      return
    }

    if (data) results.value = data.map(t => ({ id: t.id, label: t.name }))

    set(loading, false)
  }

  watch(
    searchTerm,
    () => {
      if (searchTerm.value) fetchSearchResults()
    },
    { immediate: true }
  )

  return {
    results,
    loading,
    searchTerm,
    tournamentFilters
  }
}
