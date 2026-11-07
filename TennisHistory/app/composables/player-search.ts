export const usePlayerSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const players = ref<Array<PlayerType>>([])
  const pending = ref(false)

  const fetchPlayers = async () => {
    set(pending, true)
    set(players, [])

    try {
      const { data, error } = await fetchPlayersQuery(supabase, searchTerm)

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
