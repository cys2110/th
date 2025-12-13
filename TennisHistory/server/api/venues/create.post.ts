export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => venueFormSchema.parse(body))

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (c:Country {id: $country})
      MERGE (v:Venue {id: $id})
      MERGE (v)-[:LOCATED_IN]->(c)
      SET v += $venue
    `,
    params
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Venue could not be created"
    })
  } else {
    return { ok: true }
  }
})
