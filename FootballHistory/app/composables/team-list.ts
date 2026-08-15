import { type Tables } from "~/types/database.types"
import { set } from "@vueuse/core"

type Team = Tables<{ schema: "football" }, "team"> & { aka: string }

export const useTeamList = () => {
  const supabase = useSupabaseClient()

  const teams = ref<Array<Team>>([])
  const pending = ref(false)

  const fetchTeams = async () => {
    set(pending, true)

    try {
      const { data, error } = await supabase.from("team").select("*").order("name", { ascending: true })

      if (error || !data) {
        console.error("Error fetching teams:", error)
        return
      }

      set(
        teams,
        (data || []).map(team => ({ ...team, aka: team.short_name || team.name, nickname: team.nicknames?.[0] }))
      )
    } finally {
      set(pending, false)
    }
  }

  fetchTeams()

  return {
    teams,
    pending,
    fetchTeams
  }
}
