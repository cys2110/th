import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => entryFormSchema.parse(body))

    const isCountryDraw = params.event.includes("Country")

    let query = ""

    if (isCountryDraw) {
      query = `/* cypher */
        MATCH (e:Event {id: $event})-[:EVENT_OF]->(ed:Edition)
        MATCH (p:Player {id: $player1})-[:REPRESENTS]->(c:Country)
        OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      `

      if (params.player2) {
        query += `/* cypher */
          MATCH (p2:Player {id: $player2})
          WITH p, p2, coalesce(c1, c) AS country
          MATCH (cf:CountryEntry {id: $event || ' ' || country.id})
          MERGE (f:Entry:$($type) {id: $event || ' ' || substring($type, 0, 1) || ' ' || p.id || ' ' || p2.id})
          MERGE (p)-[t:ENTERED]->(f)
          MERGE (p2)-[t2:ENTERED]->(f)
        `
      } else {
        query += `/* cypher */
          WITH p, coalesce(c1, c) AS country
          MATCH (cf:CountryEntry {id: $event || ' ' || country.id})
          MERGE (f:Entry:$($type) {id: $event || ' ' || substring($type, 0, 1) || ' ' || p.id})
          MERGE (p)-[t:ENTERED]->(f)
        `
      }

      query += `
        MERGE (f)-[:MEMBER_OF]->(cf)
        SET f += $entry
      `

      if (params.rank) {
        query += `
          SET t.rank = $rank
        `
      }

      if (params.rank2) {
        query += `
          SET t2.rank = $rank2
        `
      }
    } else {
      query = `/* cypher */
        MATCH (e:Event {id: $event})
        MATCH (p1:Player {id: $player1})
      `

      if (params.player2) {
        query += `
          MATCH (p2:Player {id: $player2})
          MERGE (f:Entry:$($type) {id: $event || ' ' || $player1 || ' ' || $player2})
          MERGE (p1)-[t1:ENTERED]->(f)
          MERGE (p2)-[t2:ENTERED]->(f)
        `

        if (params.rank2) {
          query += `
            SET t2.rank = $rank2
          `
        }
      } else {
        query += `
          MERGE (f:Entry:$($type) {id: $event || ' ' || $player1})
          MERGE (p1)-[t1:ENTERED]->(f)
        `
      }

      query += `
        SET f += $entry
      `

      if (params.rank) {
        query += `
          SET t1.rank = $rank
        `
      }
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Entry could not be created" })
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
