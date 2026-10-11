import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const supabase = await serverSupabaseClient(event)

  const matchLink = String(query.match_link ?? "")
  const date = String(query.date ?? "")

  return await scrapeAoMatch(supabase, matchLink, date)
})
