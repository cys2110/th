interface SearchResults {
  id: string
  full_name: string
}

export const usePersonSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const results = ref<Array<SearchResults>>([])

  const pending = ref(false)

  const fetchSearchResults = async () => {
    set(results, [])
    set(pending, true)

    try {
      const { data, error } = await supabase
        .from("people")
        .select("id, full_name")
        .ilike("full_name", `%${toValue(searchTerm)}%`)
        .limit(40)
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true })
        .order("id", { ascending: true })

      if (error || !data) {
        console.error("Error fetching people search results:", error)
        return
      }

      set(results, data)
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
