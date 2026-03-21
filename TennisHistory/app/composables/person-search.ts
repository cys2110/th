interface SearchResults {
  id: string
  label: string
}

export const usePersonSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const selectedPeople = ref<Array<SearchResults>>([])

  const results = ref<Array<SearchResults>>([])

  const loading = ref(false)

  const refresh = () => {
    fetchSearchResults()
  }

  const fetchSearchResults = async () => {
    results.value = []

    set(loading, true)

    const { data, error } = await supabase.rpc("search_people", { search_term: toValue(searchTerm) })

    if (error || !data) {
      console.error("Error fetching people search results:", error)
      set(loading, false)
      return
    }

    results.value = data.map(v => ({ id: v.id, label: `${v.first_name} ${v.last_name}` }))

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
    selectedPeople,
    refresh
  }
}
