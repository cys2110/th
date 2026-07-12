import { type QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"

export const useTeamSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const teamQuery = () => {
    const query = supabase.from("team").select("*").limit(40).order("name", { ascending: true })

    if (toValue(searchTerm)) {
      query.ilike("name", `%${toValue(searchTerm)}%`)
    }

    return query
  }

  type TeamType = QueryData<ReturnType<typeof teamQuery>>[number]

  const teams = ref<Array<TeamType>>([])
  const pending = ref(false)

  const fetchTeams = async () => {
    set(pending, true)
    set(teams, [])

    try {
      const { data, error } = await teamQuery()

      if (error || !data) {
        console.error("Error fetching teams:", error)
        return
      }

      set(teams, data)
    } finally {
      set(pending, false)
    }
  }

  watch(
    searchTerm,
    () => {
      fetchTeams()
    },
    { immediate: true }
  )

  return {
    teams,
    pending,
    fetchTeams,
    searchTerm
  }
}
