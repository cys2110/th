import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => editionFormSchema.parse(body))

    let query = `/* cypher */
    MATCH (e:Edition {id: $id})
    SET e += $edition, e.updated_at = date()
  `

    if ("tours" in params) {
      query += `
      REMOVE e:$( [x IN labels(e) WHERE x <> 'Edition'] )
      SET e:$( $tours )
    `
    }

    if ("surface" in params) {
      query += `
      WITH e
      OPTIONAL MATCH (e)-[s1:ON_SURFACE]->(:Surface)
      DELETE s1
    `

      if (params.surface) {
        query += `
      WITH e
      MATCH (s:Surface {id: $surface})
      MERGE (e)-[:ON_SURFACE]->(s)
    `
      }
    }

    if ("venues" in params) {
      query += `
      WITH e
      OPTIONAL MATCH (e)-[v1:TOOK_PLACE_IN]->(:Venue)
      DELETE v1
    `

      if (params.venues?.length) {
        query += `
      WITH e
      UNWIND $venues AS venueId
      MATCH (v:Venue {id: venueId})
      MERGE (e)-[:TOOK_PLACE_IN]->(v)
    `
      }
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: `Edition ${params.id} could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "No changes to save" })
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
