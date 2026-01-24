import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await getValidatedQuery(event, query => idSchema.parse(query))

    const query = `/* cypher */
      MATCH
        (f:Entry WHERE f.status IN ['Q', 'LL', 'AL', 'WC'])-[:SCORED]->
        (:Winner)-[:SCORED]->
        (m:Match)-[:PLAYED]->
        (:Round {round: 'Final'})-[:ROUND_OF]->
        (e:Event)-[:EVENT_OF]-
        (ed:Edition)-[:EDITION_OF]->
        (:Tournament {id: $id})
      MATCH (ed)-[:IN_YEAR]->(y:Year)
      ORDER BY y.id

      CALL (f, e, ed) {
        MATCH
        (c:Country)<-[:REPRESENTS]-
        (p:Player)-[:ENTERED]->(f)
        OPTIONAL MATCH (p)-[t:REPRESENTED WHERE t.start_date <= coalesce(e.start_date, ed.start_date) AND t.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)

        RETURN COLLECT(DISTINCT apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
          { country: coalesce(properties(c1), properties(c)) }
        )) AS players
      }
      WITH
        f.status AS status,
        y.id AS year,
        ed.id AS edId,
        CASE
          WHEN m:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        players,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
      RETURN
        {
          tour: tour,
          status: status,
          year: year,
          type: type,
          id: edId,
          team: players
        } AS winner
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.id.toInt()} could not be found.`
      })
    }

    const results = records.map(record => {
      const result = record.get("winner")
      return tournamentStatusSchema.parse(result)
    })

    return results
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        // data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
        data: error.issues.map(i => ({
          [`${i.path.join(".")}`]: {
            message: i.message,
            input: i.input
          }
        }))
      })
    }

    console.error(error)
    throw error
  }
})
