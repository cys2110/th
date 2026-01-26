import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => venueFormSchema.parse(body))

    const query = `/* cypher */
      MATCH (v:Venue { id: $id })
      SET v += $venue

      WITH v
      MATCH (v)-[t:LOCATED_IN]->(:Country)
      DELETE t

      WITH v
      MATCH (c:Country { id: $country })
      MERGE (v)-[:LOCATED_IN]->(c)
    `

    const { summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      return {
        success: false,
        message: `${params.id} could not be updated.`,
        statusObjects
      }
    }

    return {
      success: true,
      message: `${params.id} updated successfully.`,
      statusObjects
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: formatZodError(error)
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Error updating venue",
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
