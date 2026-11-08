import type { MaybeRefOrGetter } from "vue"
import { set } from "@vueuse/core"

export const useEntryList = (
  tournamentId: MaybeRefOrGetter<string | undefined>,
  year: MaybeRefOrGetter<string | number | undefined>,
  editionNo: MaybeRefOrGetter<string | number | undefined>
) => {
  const supabase = useSupabaseClient()

  const entries = ref<Array<TeamEntry>>([])
  const pending = ref(false)

  let requestId = 0
  const fetchEntries = async () => {
    const currentRequest = ++requestId
    const id = toValue(tournamentId)
    const selectedYear = toValue(year)
    const selectedEdition = toValue(editionNo)
    entries.value = []
    if (!id || selectedYear == null || selectedEdition == null) {
      pending.value = false
      return
    }
    set(pending, true)

    try {
      const { data, error } = await supabase
        .schema("tennis")
        .from("entries_by_team")
        .select("*")
        .eq("tournament_id", id)
        .eq("year", Number(selectedYear))
        .eq("edition_no", Number(selectedEdition))

      if (currentRequest !== requestId) return

      if (error || !data) {
        console.error("Error fetching entries", error)
      }

      entries.value = data ?? []
    } finally {
      if (currentRequest === requestId) set(pending, false)
    }
  }

  watch(() => [toValue(tournamentId), toValue(year), toValue(editionNo)], fetchEntries, { immediate: true })

  return {
    entries,
    pending,
    fetchEntries
  }
}
