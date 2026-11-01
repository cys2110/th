import { set } from "@vueuse/core"

export const useEntryList = (tournamentId: string, year: string, editionNo: string) => {
  const supabase = useSupabaseClient()

  const entries = ref<Array<TeamEntry>>([])
  const pending = ref(false)

  const fetchEntries = async () => {
    set(pending, true)

    try {
      const { data, error } = await supabase
        .schema("tennis")
        .from("entries_by_team")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("year", Number(year))
        .eq("edition_no", Number(editionNo))

      if (error || !data) {
        console.error("Error fetching entries", error)
      }

      entries.value = data!
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
