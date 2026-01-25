import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerCreateSchema.parse(body))

    const query = "MERGE (p:Player:$($tour) { id: $id })"

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "00001")) {
      return true
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
