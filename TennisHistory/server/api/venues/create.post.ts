import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
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
        statusMessage: `${params.id} could not be created`
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
