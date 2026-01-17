import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      MATCH
        (p:Player {id: $id})-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (:Match)-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event)-[:EVENT_OF]->
        (ed:Edition)-[:EDITION_OF]->
        (t:Tournament)
      MATCH (ed)-[:IN_YEAR]->(y:Year)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)

      WITH ed, y, t, r, s, coalesce(e.start_date, ed.start_date) AS start_date, coalesce(e.end_date, ed.end_date) AS end_date, coalesce(e.category, ed.category) AS category, coalesce(properties(es), properties(eds)) AS surface
      WITH ed, y, t, start_date, end_date, category, surface, collect({r: r, s: s}) AS rs
      WITH
        ed,
        y,
        t,
        start_date,
        end_date,
        category,
        surface,
        reduce(
          best = null,
          x IN
          rs |
            CASE
              WHEN best IS NULL OR x.r.number < best.r.number THEN x
              ELSE best
            END) AS best
      ORDER BY start_date DESC
      LIMIT 10

      RETURN {
        tournament: apoc.map.submap(t, ['id', 'name']),
        id: ed.id,
        year: y.id,
        start_date: start_date,
        end_date: end_date,
        round: best.r.round,
        category: category,
        surface: surface,
        title:
          CASE
            WHEN
              best.r.round = 'Final'
              THEN
                CASE
                  WHEN best.s:Winner THEN true
                  ELSE false
                END
            ELSE false
          END
      } AS edition;
    `

    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("edition")
      return playerRecentEventSchema.parse(result)
    })

    return results
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
