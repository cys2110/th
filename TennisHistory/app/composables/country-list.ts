export const useCountryList = () => {
  const supabase = useSupabaseClient()

  const countries = ref<Array<CountryInterface & { icon: string }>>([])

  const pending = ref(false)

  const fetchCountries = async () => {
    set(pending, true)

    try {
      const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

      if (error || !data) {
        console.error("Error fetching countries:", error)
        return
      }

      countries.value = data.map(v => ({
        ...v,
        icon: getFlagCode(v as unknown as CountryInterface)
      }))
    } finally {
      set(pending, false)
    }
  }

  fetchCountries()

  return {
    countries,
    pending
  }
}
