import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const supabase = await serverSupabaseClient(event)

  const tournamentId = String(query.tournament_id ?? query.db_id ?? "")
  const dbId = String(query.db_id ?? "")
  const year = String(query.year ?? "")
  const tour = String(query.tour ?? "")
  const superTiebreak = query.super_tiebreak === "true"
  const format = String(query.format ?? "")
  const editionNo = String(query.edition_no ?? "0")

  if (!dbId || !year) {
    throw createError({
      statusCode: 400,
      statusMessage: "tournament_id and year are required"
    })
  }

  if (tournamentId === "580") {
    return await scrapeAoDraw(supabase)
  } else if (tournamentId === "540") {
    return await scrapeWimbledonDraw(supabase, year)
  } else if (tournamentId === "560") {
    return await scrapeUsoDraw(supabase, year)
  }

  if (!tour) {
    throw createError({
      statusCode: 400,
      statusMessage: "tour are required"
    })
  }

  if (tour === "WTA") {
    return await scrapeWtaDraw(supabase, tournamentId, dbId, year, editionNo)
  }

  return await scrapeAtpDraw(supabase, tournamentId, dbId, year, editionNo, format, superTiebreak)
})
