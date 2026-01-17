import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const { summary } = await useDriver().executeQuery("MERGE (p:Player:$($tour) {id: $id})", params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      return {
        success: false,
        error: `Player ${params.id} could not be created`
      }
    } else {
      return { success: true, error: null }
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
