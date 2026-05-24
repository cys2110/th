interface SearchResults {
  id: number
  name: string
}

export const useTournamentSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const results = ref<Array<SearchResults>>([])

  const pending = ref(false)

  const fetchSearchResults = async () => {
    set(results, [])
    set(pending, true)

    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name")
      .ilike("name", `%${toValue(searchTerm)}%`)
      .limit(20)
      .order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching tournaments search results:", error)
      set(pending, false)
      return
    }

    if (data) set(results, data)

    set(pending, false)
  }

  // Watch is not immediate - the function is first triggered when the search dropdown is opened
  watch(searchTerm, () => {
    fetchSearchResults()
  })

  return {
    searchTerm,
    results,
    pending
  }
}
