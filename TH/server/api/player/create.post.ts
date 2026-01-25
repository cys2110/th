import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerCreateSchema.parse(body))

    const query = `/* cypher */
      MERGE (p:Player:$($tour) { id: $id })
    `

    const { summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      return {
        success: false,
        message: `${params.id} could not be created.`,
        statusObjects
      }
    }

    return {
      success: true,
      message: `${params.id} created successfully.`,
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
      statusMessage: "Error creating player",
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
