import { ZodError } from "zod"

export default defineEventHandler(async () => {
  try {
    const query = `/* cypher */
      MATCH (c:Country)
      RETURN properties(c) AS country
      ORDER BY toLower(c.name)
    `

    const { records, summary } = await useDriver().executeQuery(query)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    const results = records.map(record => {
      const country = record.get("country")
      return countrySchema.parse(country)
    })

    return {
      results,
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
      statusMessage: "Error fetching countries",
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
