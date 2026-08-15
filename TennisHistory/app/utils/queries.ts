import type { QueryData } from "@supabase/supabase-js"

const supabase = useSupabaseClient()

const fetchTournaments = (offset: Ref<number>) =>
  supabase
    .from("tournaments")
    .select("*", { count: "exact" })
    .range(toValue(offset), toValue(offset) + 29)
export type TournamentsQuery = QueryData<ReturnType<typeof fetchTournaments>>[number]
