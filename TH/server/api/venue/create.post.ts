import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => venueFormSchema.parse(body))

    const query = `/* cypher */
      MATCH (c:Country { id: $country })
      MERGE (v:Venue { id: $id })
      MERGE (v)-[:LOCATED_IN]->(c)
      SET v += $venue
    `

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${params.id} could not be created`
      })
    } else {
      return true
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
      })
    }

    console.error(error)
    throw error
  }
})
