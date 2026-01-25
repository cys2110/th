import { ZodError } from "zod"

export default defineEventHandler(async event => {
  const params = getQuery(event)

  try {
    const query = `/* cypher */
      MATCH (c:Country { id: $id })
      RETURN properties(c) AS country
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    const result = countrySchema.parse(records[0]?.get("country"))

    return {
      result,
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
      statusMessage: `Error fetching ${params.id}`,
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
