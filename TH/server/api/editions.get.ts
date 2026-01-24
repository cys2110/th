import { ZodError } from "zod"
import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { id } = getQuery<{ id: string }>(event)

    let query = `/* cypher */
      MATCH (:Tournament { id: $id })<-[:EDITION_OF]-(e:Edition)-[:IN_YEAR]->(y:Year)
    `

    if (COUNTRY_DRAWS.includes(id)) {
      query += `/* cypher */
        OPTIONAL MATCH (country:Country)-[:ENTERED]->(:CountryEntry)<-[:MEMBER_OF]-(:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(:Round { round: 'Final' })-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(e)

        WITH
          e.id AS id,
          [x IN labels(e) WHERE x <> 'Edition'] AS tours,
          y.id AS year,
          properties(country) AS winner
      `
    } else if (id === "9210") {
      query += `/* cypher */
        OPTIONAL MATCH (f:LaverEntry)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(e) WHERE f.points > 12

        WITH
          e.id AS id,
          [x IN labels(e) WHERE x <> 'Edition'] AS tours,
          y.id AS year,
          properties(f) AS winner
      `
    } else {
      query += `/* cypher */
        OPTIONAL MATCH (e)<-[:EVENT_OF]-(event:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(m:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(country:Country)

        WITH
          e,
          y,
          CASE
            WHEN f:Singles THEN 'Singles'
            WHEN f:Doubles THEN 'Doubles'
            ELSE NULL
          END AS type,
          p,
          [x IN labels(event) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour,
          country,
          coalesce(e.start_date, event.start_date) AS start_date
        WHERE type IS NOT NULL
        ORDER BY tour, type DESC

        OPTIONAL MATCH (p)-[cdate:REPRESENTED WHERE cdate.start_date <= start_date AND cdate.end_date > start_date]->(country1:Country)

        WITH
          e,
          y,
          type,
          tour,
          COLLECT(DISTINCT apoc.map.merge(
            apoc.map.submap(
              p,
              ['id', 'first_name', 'last_name'],
              null,
              false
            ),
            { country: coalesce(properties(country1), properties(country)) }
          )) AS team

        WITH
          e.id AS id,
          [x IN labels(e) WHERE x <> 'Edition'] AS tours,
          y.id AS year,
          { team: team, type: type, tour: tour } AS winner
      `
    }

    query += `/* cypher */
      ORDER BY year DESC

      RETURN apoc.map.clean(
        {
          id: id,
          tours: tours,
          year: year,
          winner: winner
        },
        [],
        [null]
      ) AS edition
    `

    const { records, summary } = await useDriver().executeQuery(query, { id: int(id) })

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${id} could not be found.`
      })
    }

    const results = records.map(record => {
      const result = record.get("edition")
      return baseEditionSchema.parse(result)
    })

    return results
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: error.issues.map(i => ({
          [i.path.join(".")]: {
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
