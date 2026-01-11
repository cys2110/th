import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => venueFormSchema.parse(body))

    let query = `/* cypher */
    MATCH (v:Venue {id: $id})
    SET v += $venue
  `

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

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: `${params.id} could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.id} could not be updated`
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
