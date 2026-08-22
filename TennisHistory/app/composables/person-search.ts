import type { QueryData } from "@supabase/supabase-js"
import { set } from "@vueuse/core"
import { deburr } from "lodash"

export const usePersonSearch = () => {
  const supabase = useSupabaseClient()

  const searchTerm = ref()

  const personQuery = () => {
    const query = supabase.schema("tennis").rpc("search_people", { search_term: deburr(toValue(searchTerm)) || null })

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
        console.error("Error fetching people:", error)
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
