import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => body)

    const query = `/* cypher */`

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404
        // statusMessage: `${params.person.first_name} ${params.person.last_name} could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({
        statusCode: 400
        // statusMessage: `${params.person.first_name} ${params.person.last_name} could not be updated`
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
