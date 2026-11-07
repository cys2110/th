import type { QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"
import { deburr } from "lodash"

export const useVenueSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const venues = ref<Array<VenueType>>([])
  const pending = ref(false)

  const fetchVenues = async () => {
    set(pending, true)
    set(venues, [])

    try {
      const { data, error } = await fetchVenuesQuery(supabase, searchTerm)

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
