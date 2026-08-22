export default defineEventHandler(async event => {
  const query = getQuery(event)

  const id = String(query.id ?? "")

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required"
    })
  }

  // If ID is a number, it's a player ID
  if (isNaN(Number(id))) {
    return await scrapeAtpPlayer(id)
  }

  return scrapeWtaPlayer(id)
})
