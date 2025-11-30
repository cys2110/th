export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => venueFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (v:Venue {id: $id})
  `

  if ("name" in params) {
    query += `
      SET v.name = $name
    `
  }

  if ("city" in params) {
    query += `
      SET v.city = $city
    `
  }

  if ("country" in params) {
    query += `
      WITH v
      MATCH (v)-[t:LOCATED_IN]->(:Country)
      DELETE t
      WITH v
      MATCH (c:Country {id: $country})
      MERGE (v)-[:LOCATED_IN]->(c)
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Venue could not be updated"
    })
  } else {
    return { ok: true }
  }
})
