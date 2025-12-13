export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => tournamentFormSchema.parse(body))

  let query = `/* cypher */
    MERGE (t:Tournament:$($tours) {id: $id, updated_at: date()})
    SET t += $tournament
  `

  if (params.established) {
    query += `
      WITH t
      MATCH (y:Year {id: $established})
      MERGE (t)-[:ESTABLISHED]->(y)
    `
  }

  if (params.abolished) {
    query += `
      WITH t
      MATCH (y:Year {id: $abolished})
      MERGE (t)-[:ABOLISHED]->(y)
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Tournament could not be created" })
  } else {
    return { ok: true }
  }
})
