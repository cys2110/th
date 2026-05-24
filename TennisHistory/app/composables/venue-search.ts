interface SearchResults {
  id: string
  label: string
  icon: string
}

export const useVenueSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const results = ref<Array<SearchResults>>([])

  const pending = ref(false)

  const fetchSearchResults = async () => {
    set(results, [])
    set(pending, true)

    try {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, city, countries(*)")
        .ilike("slug", `%${toValue(searchTerm)}%`)
        .limit(40)
        .order("city", { ascending: true })
        .order("name", { ascending: true })

      if (error || !data) {
        console.error("Error fetching venue search results:", error)
        return
      }

      set(
        results,
        data.map(v => ({
          id: v.id,
          label: v.name ? `${v.name}, ${v.city}` : v.city,
          icon: getFlagCode(v.countries!)
        }))
      )
    } finally {
      set(pending, false)
    }
  }

  watch(searchTerm, () => {
    fetchSearchResults()
  })

  return {
    results,
    pending,
    searchTerm,
    fetchSearchResults
  }
}
