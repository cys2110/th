import { type QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"

export const useFederationSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const federationQuery = () => {
    const query = supabase.from("national_association").select("*, country(*)").limit(40).order("name", { ascending: true })

    if (toValue(searchTerm)) {
      query.ilike("name", `%${toValue(searchTerm)}%`)
    }

    return query
  }

  type Federation = QueryData<ReturnType<typeof federationQuery>>[number]

  const federations = ref<Array<Federation>>([])
  const pending = ref(false)

  const fetchFederations = async () => {
    set(pending, true)
    set(federations, [])

    try {
      const { data, error } = await federationQuery()

      if (error || !data) {
        console.error("Error fetching venues:", error)
        return
      }

      set(federations, data)
    } finally {
      set(pending, false)
    }
  }

  watch(
    searchTerm,
    () => {
      fetchFederations()
    },
    { immediate: true }
  )

  return {
    federations,
    pending,
    fetchFederations,
    searchTerm
  }
}
