import type { QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"

export const useVenueSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const venueQuery = () => {
    const query = supabase.from("venue").select("*, country(*)").limit(40).order("city", { ascending: true }).order("name", { ascending: true })

    if (toValue(searchTerm)) {
      query.or(`slug.ilike.${toValue(searchTerm)}%,slug.ilike.%${toValue(searchTerm)}%`)
    }

    return query
  }

  type Venue = QueryData<ReturnType<typeof venueQuery>>[number]

  const venues = ref<Array<Venue>>([])
  const pending = ref(false)

  const fetchVenues = async () => {
    set(pending, true)
    set(venues, [])

    try {
      const { data, error } = await venueQuery()

      if (error || !data) {
        console.error("Error fetching venues:", error)
        return
      }

      set(venues, data)
    } finally {
      set(pending, false)
    }
  }

  watch(
    searchTerm,
    () => {
      fetchVenues()
    },
    { immediate: true }
  )

  return {
    venues,
    pending,
    fetchVenues,
    searchTerm
  }
}
