interface SearchResults {
  id: string
  label: string
  icon: string
}

export const useVenueSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const selectedVenues = ref<Array<SearchResults>>([])

  const results = ref<Array<SearchResults>>([])

  const loading = ref(false)

  const refresh = () => {
    fetchSearchResults()
  }

  const fetchSearchResults = async () => {
    results.value = []

    set(loading, true)

    const { data, error } = await supabase
      .from("venues")
      .select("*, countries(*)")
      .or(`name.ilike.%${toValue(searchTerm)}%, city.ilike.%${toValue(searchTerm)}%`)
      .limit(20)
      .order("city", { ascending: true })
      .order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching venue search results:", error)
      set(loading, false)
      return
    }

    results.value = data.map(v => ({ id: v.id, label: v.name ? `${v.name}, ${v.city}` : v.city, icon: getFlagCode(v.countries!) }))

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
    selectedVenues,
    refresh
  }
}
