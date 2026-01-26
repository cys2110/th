import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => personFormSchema.parse(body))

    const query = `/* cypher */
      MATCH (n:$($type) { id: $id })
      SET n += $person
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
      statusMessage: "Error updating person",
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
