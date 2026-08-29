import { set } from "@vueuse/core"

export const useEntryList = (tournamentId: string, year: string, editionNo: string) => {
  const supabase = useSupabaseClient()

  const entries = ref<Array<EntriesQuery & { label: string }>>([])
  const pending = ref(false)

  const fetchEntries = async () => {
    set(pending, true)

    try {
      const { data: editionData, error: editionError } = await supabase
        .schema("tennis")
        .from("editions")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("year", Number(year))
        .eq("edition_no", Number(editionNo))
        .single()

      if (editionError || !editionData) {
        console.error("Error fetching edition:", editionError)
        return
      }

      const { data, error } = await fetchEntriesQuery(supabase, editionData.id)

      if (error || !data) {
        console.error("Error fetching entries:", error)
        return
      }

      entries.value = data.map(entry => ({
        ...entry,
        label: entry.team.map(team => team.full_name).join(" / ")
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
