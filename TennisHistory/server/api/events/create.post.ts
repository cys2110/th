import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => eventFormSchema.parse(body))

    let query = `/* cypher */
    MATCH (ed:Edition {id: $edition})
    MERGE (e:Event:$($tour):$($level) {id: $id})
    MERGE (e)-[:EVENT_OF]->(ed)
    SET e += $event, e.updated_at = date()
  `

    if (params.surface) {
      query += `
      WITH e
      MATCH (s:Surface {id: $surface})
      MERGE (e)-[:ON_SURFACE]->(s)
    `
    }

    if (params.venues?.length) {
      query += `
      WITH e
      UNWIND $venues AS venueId
      MATCH (v:Venue {id: venueId})
      MERGE (e)-[:TOOK_PLACE_IN]->(v)
    `
    }

    if (params.supervisors?.length) {
      query += `
      WITH e
      UNWIND $supervisors AS supervisorId
      MATCH (su:Supervisor {id: supervisorId})
      MERGE (e)<-[:SUPERVISED]-(su)
    `
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Event could not be created" })
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
