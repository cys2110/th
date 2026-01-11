import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => eventFormSchema.parse(body))

    let query = `/* cypher */
    MATCH (e:Event {id: $id})
    SET e += $event, e.updated_at = date()
  `

    if ("surface" in params) {
      query += `
      WITH e
      OPTIONAL MATCH (e)-[os:ON_SURFACE]->(s:Surface)
      DELETE os
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
      OPTIONAL MATCH (e)-[ov:AT_VENUE]->(v:Venue)
      DELETE ov
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

    if ("supervisors" in params) {
      query += `
      WITH e
      OPTIONAL MATCH (e)<-[os:SUPERVISED]-(su:Supervisor)
      DELETE os
    `
      if (params.supervisors?.length) {
        query += `
        WITH e
        UNWIND $supervisors AS supervisorId
        MATCH (su:Supervisor {id: supervisorId})
        MERGE (e)<-[:SUPERVISED]-(su)
      `
      }
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Event could not be found."
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Event could not be updated" })
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
