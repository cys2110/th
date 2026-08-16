import { type QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"

export const usePlayerSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const playerQuery = () => {
    const query = supabase.schema("football").rpc("search_players", { search_term: toValue(searchTerm) || null })

    return query
  }

  type PlayerType = QueryData<ReturnType<typeof playerQuery>>[number]

  const players = ref<Array<PlayerType>>([])
  const pending = ref(false)

  const fetchPlayers = async () => {
    set(pending, true)
    set(players, [])

    try {
      const { data, error } = await playerQuery()

      if (error || !data) {
        console.error("Error fetching players:", error)
        return
      }

      set(players, data)
    } finally {
      set(pending, false)
    }
  }

  watch(
    searchTerm,
    () => {
      fetchPlayers()
    },
    { immediate: true }
  )

  return {
    players,
    pending,
    fetchPlayers,
    searchTerm
  }
}
