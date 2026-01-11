import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
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
      throw createError({
        statusCode: 400,
        statusMessage: `${params.tournament.name} could not be created.`
      })
    } else {
      return { success: true }
    }
  } catch (error) {
    const zodErr = error instanceof ZodError ? error : error instanceof Error && error.cause instanceof ZodError ? error.cause : null

    if (zodErr) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body",
        data: {
          validationErrors: zodErr.issues
        }
      })
    }

    throw error
  }
})
