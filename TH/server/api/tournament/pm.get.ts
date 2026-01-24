import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await getValidatedQuery(event, query => idSchema.parse(query))

    const query = `/* cypher */
      MATCH (:Tournament {id: $id})<-[:EDITION_OF]-
      (ed:Edition)<-[:EVENT_OF]-
      (e:Event)<-[:ROUND_OF]-(r:Round)
      MATCH (ed)-[:IN_YEAR]->(y:Year)

      WITH
        ed,
        r,
        y,
        e,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour,
        CASE
          WHEN r:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type
      RETURN
        apoc.map.merge(
          properties(r),
          {
            tour: tour,
            type: type,
            currency: coalesce(e.currency, ed.currency),
            year: y.id,
            id: ed.id
          }
        ) AS round
      ORDER BY y.id DESC, tour, r.number
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.id.toInt()} could not be found.`
      })
    }

    const results = records.map(record => {
      const result = record.get("round")
      return tournamentPmSchema.parse(result)
    })

    return results
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
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
