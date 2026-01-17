import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => matchFormSchema.parse(body))

    let query = `/* cypher */
    MATCH (s1:T1)-[:SCORED]->(m:Match {id: $id})<-[:SCORED]-(s2:T2)
    SET s1 += $team1, s2 += $team2, m += $match
  `

    if (params.umpire) {
      query += `
      WITH m
      OPTIONAL MATCH (:Umpire)-[t:UMPIRED]->(m)
      DELETE t
      WITH m
      MATCH (u:Umpire {id: $umpire})
      MERGE (u)-[:UMPIRED]->(m)
    `
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Match could not be found."
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Match could not be updated" })
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
