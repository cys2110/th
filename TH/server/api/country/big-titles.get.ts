import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    let params = getQuery(event)

    params["categories"] = [
      "Grand Slam",
      "ATP Masters 1000",
      "ATP Masters Series",
      "ATP Super 9",
      "ATP Championship Series, Single Week",
      "Premier Mandatory",
      "WTA 1000",
      "Olympics",
      "Finals"
    ]

    const query = `/* cypher */
      MATCH (c:Country { id: $id })

      CALL (c) {
        MATCH (c)<-[:REPRESENTS]-(p:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(r:Round { round: 'Final' })-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:IN_YEAR]->(y:Year)
        MATCH (ed)-[:EDITION_OF]->(t:Tournament)
        OPTIONAL MATCH (p)-[z:REPRESENTED]->(:Country)

        WITH
          p,
          c,
          y,
          t,
          ed,
          [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour,
          [x IN labels(r) WHERE x IN ['Singles', 'Doubles']][0] AS type,
          coalesce(e.category, ed.category) AS category,
          coalesce(e.start_date, ed.start_date) AS start_date
        WHERE
          category IN $categories AND
          (z IS NULL OR (z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date >= coalesce(e.start_date, ed.start_date)))

        RETURN
          p AS player,
          c AS country,
          y AS year,
          t AS tournament,
          tour,
          type,
          category,
          start_date,
          ed AS edition

        UNION

        MATCH (c)<-[:REPRESENTED]-(p:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(r:Round { round: 'Final' })-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:IN_YEAR]->(y:Year)
        MATCH (ed)-[:EDITION_OF]->(t:Tournament)
        MATCH (p)-[:REPRESENTS]->(d:Country)

        WITH
          p,
          d,
          c,
          y,
          t,
          ed,
          [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour,
          [x IN labels(r) WHERE x IN ['Singles', 'Doubles']][0] AS type,
          coalesce(e.category, ed.category) AS category,
          coalesce(e.start_date, ed.start_date) AS start_date
        WHERE
          category IN $categories AND
          (c.start_date <= coalesce(e.start_date, ed.start_date) AND c.end_date >= coalesce(e.start_date, ed.start_date))

        RETURN
          p AS player,
          d AS country,
          y AS year,
          t AS tournament,
          tour,
          type,
          category,
          start_date,
          ed AS edition
      }

      RETURN
        apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(
              player,
              ['id', 'first_name', 'last_name'],
              null,
              false
            ),
            {
              country: properties(country),
              tour: tour,
              edition: {
                type: type,
                id: edition.id,
                category: category,
                tournament: properties(tournament),
                year: year.id
              }
            }
          ),
          [],
          [null]
        ) AS result
      ORDER BY toLower(result.last_name), toLower(result.first_name), start_date
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "00000")) {
      const results = records.map(record => {
        const result = record.get("result")
        return countryTitleSchema.parse(result)
      })

      return results
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Database query error",
      data: summary.gqlStatusObjects.map(s => `${s.gqlStatus}: ${s.statusDescription}`)
    })
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: error.issues.map(i => ({
          [i.path.join(".")]: {
            message: i.message,
            received: i.input
          }
        }))
      })
    }

    console.error(error)
    throw error
  }
})
