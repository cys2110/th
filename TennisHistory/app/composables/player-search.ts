interface SearchResults {
  id: string
  label: string
  icon: string
}

export const usePlayerSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const selectedPlayers = ref<Array<SearchResults>>([])

  const results = ref<Array<SearchResults>>([])

  const loading = ref(false)

  const fetchSearchResults = async () => {
    results.value = []

    set(loading, true)

    const { data, error } = await supabase.rpc("search_players", { search_term: toValue(searchTerm) })

    if (error || !data) {
      console.error("Error fetching people search results:", error)
      set(loading, false)
      return
    }

    results.value = data.map(v => ({ id: v.id, label: `${v.first_name} ${v.last_name}`, icon: getFlagCode(v.country as CountryType) }))

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
    selectedPlayers
  }
}
