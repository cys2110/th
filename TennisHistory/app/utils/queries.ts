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

export const fetchResultMatches = (supabase: SupabaseClient<Database>, tournamentId: string, year: string, editionNo: string) =>
  supabase
    .schema("tennis")
    .from("result_matches")
    .select(
      `
      *,
      umpire:people(*),
      winner:entries!matches_winner_id_fkey(
        *,
        team:player_entry_mapping!player_entry_mapping_entry_id_fkey(
          rank,
          country(*),
          ...player(id, image_url, ...people(full_name))
        )
      ),
      loser:entries!matches_loser_id_fkey(
        *,
        team:player_entry_mapping!player_entry_mapping_entry_id_fkey(
          rank,
          country(*),
          ...player(id, image_url, ...people(full_name))
        )
      ),
      match_stats(count)
    `
    )
    .eq("tournament_id", tournamentId)
    .eq("year", Number(year))
    .eq("edition_no", Number(editionNo))
export type ResultMatchQuery = QueryData<ReturnType<typeof fetchResultMatches>>[number]

export const fetchMatchDetails = (supabase: SupabaseClient<Database>, matchId: string) =>
  supabase
    .schema("tennis")
    .from("match_details")
    .select(
      `
      *,
      umpire:people(*),
      team1:entries!matches_team_1_id_fkey(
        *,
        team:player_entry_mapping!player_entry_mapping_entry_id_fkey(
          rank,
          country(*),
          ...player(id, image_url, ...people(full_name))
        )
      ),
      team2:entries!matches_team_2_id_fkey(
        *,
        team:player_entry_mapping!player_entry_mapping_entry_id_fkey(
          rank,
          country(*),
          ...player(id, image_url, ...people(full_name))
        )
      )
    `
    )
    .eq("id", matchId)
    .single()
export type MatchDetailsQuery = QueryData<ReturnType<typeof fetchMatchDetails>>
