export const useCountryList = () => {
  const supabase = useSupabaseClient()

  const countries = ref<Array<CountryInterface>>([])

  const pending = ref(false)

  const fetchCountries = async () => {
    set(pending, true)

    try {
      const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

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
