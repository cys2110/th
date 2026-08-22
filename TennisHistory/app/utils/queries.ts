import type { QueryData, SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "~/types/database.types"

export const fetchEdition = (supabase: SupabaseClient<Database>, tournamentId: string, year: string, editionNo: string) =>
  supabase
    .schema("tennis")
    .from("editions")
    .select(
      `
      *,
      ...surface(surface:name),
      venue(*, ...country(icon)),
      events(
        *,
        ...surface(surface:name),
        venue(*, ...country(icon)),
        event_supervisor_mapping(...people(full_name))
      )
    `
    )
    .eq("tournament_id", tournamentId)
    .eq("year", Number(year))
    .eq("edition_no", Number(editionNo))
    .order("tour", { referencedTable: "events", ascending: true })
    .single()
export type EditionQuery = QueryData<ReturnType<typeof fetchEdition>>

export const fetchRounds = (supabase: SupabaseClient<Database>, editionId: string) =>
  supabase
    .schema("tennis")
    .from("rounds")
    .select("*, ...events!inner(currency, edition:editions(currency))")
    .eq("events.edition_id", editionId)
    .order("tour", { ascending: true })
    .order("match_type", { ascending: true })
    .order("number", { ascending: true })
export type RoundsQuery = QueryData<ReturnType<typeof fetchRounds>>[number]
