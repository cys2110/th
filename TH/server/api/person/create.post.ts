import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => personFormSchema.parse(body))

    const query = `/* cypher */
      MERGE (n:$($type) { id: $id })
      SET s += $person
    `

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${params.person.first_name} ${params.person.last_name} could not be created`
      })
    } else {
      return { success: true }
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
