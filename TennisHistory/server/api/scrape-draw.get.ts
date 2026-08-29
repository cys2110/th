import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const supabase = await serverSupabaseClient(event)

  const tournamentId = String(query.tournament_id ?? "")
  const year = String(query.year ?? "")
  const tour = String(query.tour ?? "")
  const superTiebreak = Boolean(query.super_tiebreak)
  const format = String(query.format ?? "")

  if (!tournamentId || !year || !tour) {
    throw createError({
      statusCode: 400,
      statusMessage: "tournament_id, year and tour are required"
    })
  }

  return await scrapeAtpDraw(supabase, tournamentId, year, format, superTiebreak)
})
