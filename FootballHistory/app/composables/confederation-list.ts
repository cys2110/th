import { type Tables } from "~/types/database.types"
import { set } from "@vueuse/core"

type Confederation = Tables<{ schema: "football" }, "confederation">

export const useConfederationList = () => {
  const supabase = useSupabaseClient()

  const confederations = ref<Array<Confederation>>([])
  const pending = ref(false)

  const fetchConfederations = async () => {
    set(pending, true)

    try {
      const { data, error } = await supabase.schema("football").from("confederation").select("id, name").order("id", { ascending: true })

      if (error || !data) {
        console.error("Error fetching confederations:", error)
        return
      }

      set(confederations, data)
    } finally {
      set(pending, false)
    }
  }

  fetchConfederations()

  return {
    confederations,
    pending,
    fetchConfederations
  }
}
