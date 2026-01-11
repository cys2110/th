import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  let query = `/* cypher */
    CYPHER 25
    MATCH (:Tournament {id: $id})<-[:EDITION_OF]-(e:Edition)-[:IN_YEAR]->(y:Year)

    WITH e, y
    ORDER BY y.id DESC

    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)

    WITH
      e,
      [x IN labels(e) WHERE x <> 'Edition'] AS tours,
      y.id AS year,
      properties(s) AS surface,
      CASE
        WHEN COUNT (v) = 0 THEN []
        ELSE COLLECT(DISTINCT apoc.map.merge(
          properties(v),
          { country: properties(c) }
        ))
      END AS venues
  `

  if (COUNTRY_DRAWS.includes(id)) {
    query += `/* cypher */
      CALL (e) {
        OPTIONAL MATCH (country:Country)-[:ENTERED]->(:CountryEntry)<-[:MEMBER_OF]-(f:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(:Round {round: 'Final'})-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(e)

        RETURN DISTINCT properties(country) AS winner
      }
    `
  } else {
    query += `/* cypher */
      CALL (e) {
        OPTIONAL MATCH (e)<-[:EVENT_OF]-(event:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(m:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(country:Country)

        WITH
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

        RETURN DISTINCT { team: team, type: type, tour: tour } AS winner
      }
    `
  }

  query += `/* cypher */
    RETURN apoc.map.clean(
      apoc.map.merge(
        apoc.map.submap(e, ['id', 'sponsor_name', 'category', 'start_date', 'end_date', 'currency', 'tfc', 'draw_type'], null, false),
        {
          tours: tours,
          year: year,
          surface: surface,
          venues: venues,
          winner: winner
        }
      ),
      [],
      [null]
    ) AS edition
  `

  const { records, summary } = await useDriver().executeQuery(query, { id: int(id) })

  if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tournament with ID ${id} could not be found.`
    })
  }

  const results = records.map(record => {
    const result = record.get("edition")
    return baseEditionSchema.parse(result)
  })

  return results
})
