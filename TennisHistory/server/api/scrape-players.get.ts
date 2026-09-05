export default defineEventHandler(async event => {
  const query = getQuery(event)

  const id = String(query.id ?? "")

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required"
    })
  }

  return await (isNaN(Number(id)) ? scrapeAtpPlayer : scrapeWtaPlayer)(id)
})
