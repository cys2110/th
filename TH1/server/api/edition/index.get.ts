import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await getValidatedQuery(event, query => idSchema.parse(query))

    const query = `/* cypher */`
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
