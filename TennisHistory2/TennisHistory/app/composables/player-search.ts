interface SearchResults {
  id: string
  name: string
  icon: string
}

export const usePlayerSearch = (tour?: Ref<TourType> | TourType) => {
  const supabase = useSupabaseClient()

  const searchTerm = ref("")

  const results = ref<Array<SearchResults>>([])

  const pending = ref(false)

  const fetchSearchResults = async () => {
    set(results, [])
    set(pending, true)

    let query = supabase
      .from("players")
      .select("id, full_name, player_country_mapping!inner(end_date, countries(*))")
      .ilike("full_name", `%${toValue(searchTerm)}%`)
      .is("player_country_mapping.end_date", null)
      .limit(40)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("id", { ascending: true })

    if (tour) {
      query = query.eq("tour", toValue(tour))
    }

    const { data, error } = await query

    if (error || !data) {
      console.error("Error fetching people search results:", error)
      set(pending, false)
      return
    }

    results.value = data.map(v => ({
      id: v.id,
      name: v.full_name!,
      icon: v.player_country_mapping[0]?.countries.icon as string
    }))

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
