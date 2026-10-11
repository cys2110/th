import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const supabase = await serverSupabaseClient(event)

  const tour = String(query.tour ?? "")
  const href = String(query.href ?? "")

  if (!tour || !href) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tour and link are required"
    })
  }

  if (tour === "WTA") {
    return await scrapeWtaMatch(supabase, href)
  }

  return await scrapeAtpMatch(supabase, href)
})
