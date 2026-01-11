import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => seedFormSchema.parse(body))

    let query = ""

    if (params.draw === "Main") {
      query = `/* cypher */
        MATCH (f:Entry {id: $id})-[t:SEEDED]->(:Event)
      `
    } else {
      query = `/* cypher */
        MATCH (f:Entry {id: $id})-[t:Q_SEEDED]->(:Event)
      `
    }

    if ("seed" in params) {
      query +=
        params.draw === "Main"
          ? `
        SET f.seed = $seed
      `
          : `
        SET f.q_seed = $seed
      `
    }

    if ("rank" in params) {
      query += `
        SET t.rank = $rank
      `
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: `This seed could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Seed could not be updated" })
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
