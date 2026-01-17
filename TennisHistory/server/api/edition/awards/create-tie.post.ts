import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => tieFormSchema.parse(body))

    let query = `/* cypher */
      MATCH (r:Round {id: $round})
      OPTIONAL MATCH (r)<-[:TIE_OF]-(et:Tie)
      MATCH (cf1:CountryEntry {id: $country1})<-[:ENTERED]-(c1:Country)
      MATCH (cf2:CountryEntry {id: $country2})<-[:ENTERED]-(c2:Country)

      WITH r, cf1, cf2, c1, c2, COUNT(et) AS count

      MERGE (t:Tie {id: $round || ' ' || c1.id || ' ' || c2.id})
      MERGE (t)-[:TIE_OF]->(r)
      MERGE (cf1)-[:PLAYED]->(t)
      MERGE (cf2)-[:PLAYED]->(t)

      SET t += $tie, t.number = count + 1
    `

    if (params.venue) {
      query += `
        WITH t
        MATCH (v:Venue {id: $venue})
        MERGE (t)-[:TOOK_PLACE_IN]->(v)
      `
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Tie could not be created" })
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
