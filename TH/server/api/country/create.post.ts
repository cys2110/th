import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const { id, ...rest } = await readValidatedBody(event, body => countrySchema.parse(body))

    const params = {
      id,
      country: rest
    }

    const query = `/* cypher */
      MERGE (c:Country { id: $id })
      SET c += $country
    `

    const { summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      return {
        success: false,
        message: `${params.country.name} could not be created.`,
        statusObjects
      }
    }

    return {
      success: true,
      message: `${params.country.name} created successfully.`,
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
      statusMessage: "Error creating country",
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
