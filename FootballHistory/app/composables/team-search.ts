import { type QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"

export const useTeamSearch = (teamIds?: Ref<string[]>) => {
  const supabase = useSupabaseClient()
  const route = useRoute()

  const searchTerm = ref()

  const teamQuery = () => {
    const query = supabase.schema("football").from("team").select("*").limit(40).order("name", { ascending: true })

    if (toValue(searchTerm)) {
      query.ilike("name", `%${toValue(searchTerm)}%`)
    } else if (route.query.team && Array.isArray(route.query.team)) {
      query.in("id", route.query.team as string[])
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

      set(
        teams,
        data.map(team => ({ ...team, aka: team.short_name || team.name }))
      )
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
