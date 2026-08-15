interface SearchResult {
  id: string
  full_name: string
  icon: string
}

export const usePlayerSearch = (tour?: Ref<TourType> | TourType) => {
  const supabase = useSupabaseClient()

  const searchTerm = ref("")
  const pending = ref(false)
  const results = ref<Array<SearchResult>>([])

  const fetchSearchResults = async () => {
    set(results, [])
    set(pending, true)

    const query = supabase
      .from("players")
      .select("id, full_name, player_country_mapping!inner(countries(icon))")
      .ilike("full_name", `%${toValue(searchTerm)}%`)
      .is("player_country_mapping.end_date", null)
      .limit(20)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("id", { ascending: true })

    if (tour) query.eq("tour", toValue(tour))

    const { data, error } = await query

    if (error || !data) {
      console.error("Error fetching people search results:", error)
      set(pending, false)
      return
    }

    set(
      results,
      data.map(player => ({
        id: player.id,
        full_name: player.full_name,
        icon: player.player_country_mapping[0]!.countries.icon
      }))
    )

    set(pending, false)
  }

  // Don't immediately trigger watch - first trigger will be on dropdown open
  watch(searchTerm, () => fetchSearchResults())

  return {
    searchTerm,
    results,
    pending,
    fetchSearchResults
  }
}
