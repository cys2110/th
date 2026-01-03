import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => tournamentFormSchema.parse(body))

    let query = `/* cypher */
    MATCH (t:Tournament {id: $id})
    SET t += $tournament, t.updated_at = date()
  `

    if (params.tours) {
      query += `
      REMOVE t:$( [x IN labels(t) WHERE x <> 'Tournament'] )
      SET t:$( $tours )
    `
    }

    if ("established" in params) {
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

    if ("abolished" in params) {
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
      return {
        success: false,
        error: `${params.tournament.name} could not be found.`
      }
    } else {
      return { success: true }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues.map(e => e.message).join(", ")
      }
    }
  }
})
