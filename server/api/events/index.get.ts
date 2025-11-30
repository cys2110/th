import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { edId } = getQuery<{ edId: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (ed:Edition {id: $edId})<-[:EVENT_OF]-(e:Event)
    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)

    WITH
      ed,
      e,
      s,
      CASE
        WHEN COUNT(v) = 0 THEN []
        ELSE COLLECT(DISTINCT apoc.map.merge(properties(v), { country: properties(c) }))
      END AS venues

    CALL (e, ed) {
      OPTIONAL MATCH (e)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(country:Country)

      CALL (p, country, e, ed) {
        OPTIONAL MATCH (p)-[cdate:REPRESENTED WHERE cdate.start_date <= coalesce(ed.start_date, e.start_date) AND cdate.end_date > coalesce(ed.start_date, e.start_date)]->(country1:Country)
        RETURN coalesce(properties(country1), properties(country)) AS playerCountry
      }

      WITH
        CASE WHEN f:Singles THEN 'Singles' WHEN f:Doubles THEN 'Doubles' ELSE NULL END AS type,
        COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), { country: playerCountry})) AS players
        WHERE type IS NOT NULL

      RETURN COLLECT(DISTINCT {team: players, type: type}) AS winners
    }
    RETURN DISTINCT apoc.map.clean(
      apoc.map.merge(
        apoc.map.submap(e, ['id', 'sponsor_name', 'category', 'start_date', 'end_date', 'currency', 'pm', 'tfc'], null, false), {
            venues: venues,
            surface: properties(s),
            tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0], level: [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0], winners: winners
          }
        ), [], [null]
      ) AS event
    `,
    { edId: int(edId) }
  )

  const results = records.map(record => {
    const event = record.get("event")

    return eventSchema.parse(event)
  })

  return results
})
