import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => tournamentFormSchema.parse(body))

    let query = `/* cypher */
      MATCH (t:Tournament { id: $id })
      SET t += $tournament, t.updated_at = date()
    `

    if ("tours" in params) {
      query += `/* cypher */
        REMOVE t:$( [x IN labels(t) WHERE x <> 'Tournament'] )
        SET t:$( $tours )
      `
    }

    if ("established" in params) {
      query += `/* cypher */
        WITH t
        OPTIONAL MATCH (t)-[t1:ESTABLISHED]->(:Year)
        DELETE t1
      `

      if (params.established) {
        query += `/* cypher */
          WITH t
          MATCH (y:Year {id: $established})
          MERGE (t)-[:ESTABLISHED]->(y)
        `
      }
    }

    if ("abolished" in params) {
      query += `/* cypher */
        WITH t
        OPTIONAL MATCH (t)-[t1:ABOLISHED]->(:Year)
        DELETE t1
      `

      if (params.abolished) {
        query += `/* cypher */
          WITH t
          MATCH (y:Year {id: $abolished})
          MERGE (t)-[:ABOLISHED]->(y)
        `
      }
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.tournament.name} could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${params.tournament.name} could not be updated`
      })
    } else {
      return true
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: error.issues.map(i => ({
          [i.path.join(".")]: {
            message: i.message,
            received: i.input
          }
        }))
      })
    }

    console.error(error)
    throw error
  }
})
