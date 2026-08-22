import type { QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"
import { deburr } from "lodash"

export const useVenueSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const venueQuery = () => {
    const query = supabase.rpc("search_venues", { search_text: deburr(toValue(searchTerm)) || null, schema_name: "tennis" })

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
