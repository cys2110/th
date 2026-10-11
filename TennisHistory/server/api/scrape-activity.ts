import { serverSupabaseClient } from "#supabase/server"
import { chromium } from "playwright"

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const supabase = await serverSupabaseClient(event)

  const tournamentId = String(query.tournament_id ?? query.db_id ?? "")
  const dbId = String(query.db_id ?? "")
  const year = String(query.year ?? "")
  const tour = String(query.tour ?? "") as TourEnum
  const editionNo = String(query.edition_no ?? "")

  const errors: Array<{ player_id: string; error: string }> = []

  if (!dbId || !year || !tour) {
    throw createError({
      statusCode: 400,
      statusMessage: "tournament_id, year and tour are required"
    })
  }

  const { data: eventsData, error: eventsError } = await supabase
    .schema("tennis")
    .from("editions")
    .select("id, tournament!inner(id), events!inner(id)")
    .eq(`tournament.${tour === "WTA" ? "womens_id" : "mens_id"}`, Number(dbId))
    .eq("year", Number(year))
    .eq("edition_no", Number(editionNo))
    .eq("events.tour", tour)
    .single()

  if (eventsError || !eventsData) {
    console.error("Error fetching events:", eventsError)
    return {
      success: false,
      error: "Error fetching events"
    }
  }

  const eventId = eventsData.events[0]?.id

  if (!eventId) {
    return {
      success: false,
      error: `${tour} event not found for edition`
    }
  }

  const { data: playersData, error: playersError } = await supabase
    .schema("tennis")
    .from("player_entry_mapping")
    .select("id, player_id, ...entries!inner(entry_id:id, match_type), player!inner(tour)")
    .is("rank", null)
    .eq("entries.event_id", eventId)
    .eq("player.tour", tour)
    .order("player_id", { ascending: false })
    .limit(10)

  if (playersError || !playersData) {
    console.error("Error fetching players:", playersError)
    return {
      success: false,
      error: "Error fetching players"
    }
  }

  const browser = await chromium.launch({ headless: false })

  try {
    for (const player of playersData) {
      if (player.match_type !== "Singles" && player.match_type !== "Doubles") continue

      try {
        const result: ActivityResult = await (tour === "WTA" ? scrapeWtaActivity : scrapeAtpActivity)(
          browser,
          player.player_id,
          player.match_type,
          tournamentId,
          year
        )

        const [{ error: entryError }, { error: pemError }] = await Promise.all([
          supabase.schema("tennis").from("entries").update({ points: result.points, pm: result.pm }).eq("id", player.entry_id),
          supabase.schema("tennis").from("player_entry_mapping").update({ rank: result.rank }).eq("id", player.id)
        ])

        if (entryError) {
          errors.push({ player_id: player.player_id, error: `Error updating entry: ${entryError.message}` })
        }

        if (pemError) {
          errors.push({ player_id: player.player_id, error: `Error updating pem: ${pemError.message}` })
        }
      } catch (error) {
        errors.push({
          player_id: player.player_id,
          error: error instanceof Error ? error.message : "Unknown activity scrape error"
        })
      }
    }
  } finally {
    await browser.close()
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: "Error updating player entries",
      errors
    }
  }

  return {
    success: true
  }
})
