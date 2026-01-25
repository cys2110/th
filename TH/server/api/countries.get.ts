import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const query = `/* cypher */
      MATCH (c:Country)
      RETURN properties(c) AS country
      ORDER BY toLower(c.name)
    `

    const { records, summary } = await useDriver().executeQuery(query)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "00000")) {
      const results = records.map(record => {
        const country = record.get("country")
        return countrySchema.parse(country)
      })

      return results
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Database query error",
      data: summary.gqlStatusObjects.map(s => `${s.gqlStatus}: ${s.statusDescription}`)
    })
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
