export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => tournamentFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (t:Tournament {id: $id})
    SET t += $tournament, t.updated_at = date()
  `

  if ("tours" in params && params.tours !== undefined) {
    query += `
      REMOVE t:$( [x IN labels(t) WHERE x <> 'Tournament'] )
      SET t:$( $tours )
    `
  }

  if ("established" in params && params.established !== undefined) {
    query += `
      WITH t
      OPTIONAL MATCH (t)-[t1:ESTABLISHED]->(:Year)
      DELETE t1
    `

    if (params.established) {
      query += `
        WITH t
        MATCH (y:Year {id: $established})
        MERGE (t)-[:ESTABLISHED]->(y)
      `
    }
  }

  if ("abolished" in params && params.abolished !== undefined) {
    query += `
      WITH t
      OPTIONAL MATCH (t)-[t1:ABOLISHED]->(:Year)
      DELETE t1
    `

    if (params.abolished) {
      query += `
        WITH t
        MATCH (y:Year {id: $abolished})
        MERGE (t)-[:ABOLISHED]->(y)
      `
    }
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Tournament could not be updated" })
  } else {
    return { ok: true }
  }
})
