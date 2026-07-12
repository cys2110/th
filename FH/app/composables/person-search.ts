import type { QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"

export const usePersonSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const personQuery = () => {
    const query = supabase
      .from("people")
      .select("*, country:country!nationality_country_id(*)")
      .limit(40)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("id", { ascending: true })

    if (toValue(searchTerm)) {
      query.or(`full_name.ilike.${toValue(searchTerm)}%,full_name.ilike.%${toValue(searchTerm)}%`)
    }

    return query
  }

  type PersonType = QueryData<ReturnType<typeof personQuery>>[number]

  const people = ref<Array<PersonType>>([])
  const pending = ref(false)

  const fetchPeople = async () => {
    set(pending, true)
    set(people, [])

    try {
      const { data, error } = await personQuery()

      if (error || !data) {
        console.error("Error fetching venues:", error)
        return
      }

      set(people, data)
    } finally {
      set(pending, false)
    }
  }

  watch(
    searchTerm,
    () => {
      fetchPeople()
    },
    { immediate: true }
  )

  return {
    people,
    pending,
    fetchPeople,
    searchTerm
  }
}
