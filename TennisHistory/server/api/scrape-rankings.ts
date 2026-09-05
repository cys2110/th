import { serverSupabaseClient } from "#supabase/server"
import { parseDate } from "@internationalized/date"

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const supabase = await serverSupabaseClient(event)

  const id = String(query.id ?? "")

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required"
    })
  }

  const { data: existingRankings, error: existingRankingsError } = await supabase.schema("tennis").from("rankings").select("*").eq("player_id", id)

  if (existingRankingsError) {
    console.error("Error fetching existing rankings:", existingRankingsError)
    return []
  }

  const rankings = await (isNaN(Number(id)) ? scrapeAtpRankings : scrapeWtaRankings)(id)

  const rankingsToInsert = rankings
    .filter(r => !existingRankings.find(er => er.start_date === r.start_date && er.match_type === r.match_type))
    .map(r => {
      const startDate = parseDate(r.start_date)
      const endDate = startDate.add({ days: 6 })

      return {
        ...r,
        player_id: id,
        end_date: endDate.toString()
      }
    })

  const { error: insertError } = await supabase.schema("tennis").from("rankings").insert(rankingsToInsert)

  if (insertError) {
    console.error("Error inserting rankings:", insertError)
  }

  return rankingsToInsert
})
