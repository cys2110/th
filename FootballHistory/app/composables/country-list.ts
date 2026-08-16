import { type Tables } from "~/types/database.types"
import { set } from "@vueuse/core"

type Country = Tables<{ schema: "football" }, "country">

export const useCountryList = () => {
  const supabase = useSupabaseClient()

  const countries = ref<Array<Country>>([])
  const pending = ref(false)

  const fetchCountries = async () => {
    set(pending, true)

    try {
      const { data, error } = await supabase.schema("football").from("country").select("*").order("name", { ascending: true })

      if (error || !data) {
        console.error("Error fetching countries:", error)
        return
      }

      set(countries, data)
    } finally {
      set(pending, false)
    }
  }

  fetchCountries()

  return {
    countries,
    pending,
    fetchCountries
  }
}
