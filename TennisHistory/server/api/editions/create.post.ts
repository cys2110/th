export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => editionFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (t:Tournament {id: $tournament})
    MATCH (y:Year {id: $year})
    MERGE (e:Edition:$($tours) {id: $id})
    MERGE (e)-[:EDITION_OF]->(t)
    MERGE (e)-[:IN_YEAR]->(y)
    SET e += $edition, e.updated_at = date()
  `

  if (params.surface) {
    query += `
      WITH e
      MATCH (s:Surface {id: $surface})
      MERGE (e)-[:ON_SURFACE]->(s)
    `
  }

  if (params.venues?.length) {
    query += `
      WITH e
      UNWIND $venues AS venueId
      MATCH (v:Venue {id: venueId})
      MERGE (e)-[:TOOK_PLACE_IN]->(v)
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Edition could not be created" })
  } else {
    return { ok: true }
  }
})
