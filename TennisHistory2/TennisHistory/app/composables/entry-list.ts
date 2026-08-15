interface EntryList {
  id: string
  event_id: string
  match_type: MatchEnumType | null
  tour: TourType | null
  players: Array<Required<BasePlayerType>>
  label: string
}

export const useEntryList = (edId: number) => {
  const supabase = useSupabaseClient()

  const entries = ref<Array<EntryList>>([])
  const pending = ref(false)

  const fetchEntries = async () => {
    set(pending, true)

    try {
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          id,
          event_id,
          match_type,
          player_entry_mapping(
            players(id, first_name, last_name, full_name),
            countries(*)
          ),
          events!inner(edition_id, tour)
        `
        )
        .eq("events.edition_id", edId)

      if (error || !data) {
        console.error("Error fetching entries:", error)
        return
      }

      entries.value = data.map(v => ({
        id: v.id,
        event_id: v.event_id,
        match_type: v.match_type,
        tour: v.events.tour,
        players: v.player_entry_mapping.map(v => ({
          id: v.players.id,
          first_name: v.players.first_name,
          last_name: v.players.last_name,
          full_name: v.players.full_name,
          country: v.countries
        })),
        label: v.player_entry_mapping.map(v => v.players.full_name).join(", ")
      }))
    } finally {
      set(pending, false)
    }
  }

  fetchEntries()

  return {
    entries,
    pending,
    fetchEntries
  }
}
