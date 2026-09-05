import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const supabase = await serverSupabaseClient(event)

  const tournamentId = String(query.tournament_id ?? "")
  const year = String(query.year ?? "")
  const tour = String(query.tour ?? "")
  const editionNo = String(query.edition_no ?? "")

  if (!tournamentId || !year || !tour) {
    throw createError({
      statusCode: 400,
      statusMessage: "tournament_id, year and tour are required"
    })
  }

  return await scrapeAtpActivity(supabase, tournamentId, year, editionNo)
})
