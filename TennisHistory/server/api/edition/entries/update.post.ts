import { ZodError } from "zod/v3"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => entryFormSchema.parse(body))

    let query = `/* cypher */
      MATCH (p:Player {id: $id})-[t:ENTERED]->(f:Entry:$($type)) WHERE f.id STARTS WITH $event
      SET f += $entry
    `

    if ("rank" in params) {
      query += `
        SET t.rank = $rank
      `
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: `${params.id}'s entry could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Entry could not be updated" })
    } else {
      return { success: true }
    }
  } catch (error) {
    const zodErr = error instanceof ZodError ? error : error instanceof Error && error.cause instanceof ZodError ? error.cause : null

    if (zodErr) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body",
        data: {
          validationErrors: zodErr.issues
        }
      })
    }

    throw error
  }
})
