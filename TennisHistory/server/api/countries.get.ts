import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const query = `/* cypher */
      MATCH (c:Country)
      RETURN properties(c) AS country
      ORDER BY toLower(c.name)
    `

    const { records } = await useDriver().executeQuery(query)

    const results = records.map(record => {
      const country = record.get("country")
      return countrySchema.parse(country)
    })

    return results
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
