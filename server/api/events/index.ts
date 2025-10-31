import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { edId } = getQuery<{ edId: string }>(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (ed:Edition {id: $edId})<-[:EVENT_OF]-(e:Event)
    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)
    WITH ed, e, s, CASE WHEN COUNT(v) = 0 THEN [] ELSE COLLECT(DISTINCT apoc.map.merge(properties(v), {country: properties(v)})) END AS venues
    CALL (e, ed) {
      OPTIONAL MATCH (e)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(country:Country)
      CALL (p, country, e, ed) {
        OPTIONAL MATCH (p)-[cdate:REPRESENTED]->(country1:Country)
        CALL (*) {
          WHEN country1 IS NOT NULL AND ((
            ed.start_date IS NOT NULL AND cdate.start_date <= ed.start_date
            AND cdate.end_date > ed.start_date
          ) OR (
            e.start_date IS NOT NULL AND cdate.start_date <= e.start_date
            AND cdate.end_date > e.start_date
          )) THEN {
            RETURN properties(country1) AS playerCountry
          }
          ELSE RETURN properties(country) AS playerCountry
        }
        RETURN playerCountry
      }
      WITH CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END AS type, COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), { country: playerCountry})) AS players
      RETURN COLLECT(DISTINCT {team: players, type: type}) AS winners
    }
    RETURN DISTINCT apoc.map.clean(apoc.map.merge(apoc.map.submap(e, ['id', 'sponsor_name', 'category', 'start_date', 'end_date', 'currency', 'pm', 'tfc'], null, false), {venues: venues, surface: properties(s), tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0], level: [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0], winners: winners}), [], [null]) AS event
    `,
    { edId: int(edId) }
  )

  console.log(
    `Notifications for editions: `,
    summary.gqlStatusObjects.filter(s => !["00000", "01N51"].includes(s.gqlStatus))
  )

  const results = records.map(record => {
    const event = record.get("event")
    const numberKeys = ["pm", "tfc"]
    const dateKeys = ["start_date", "end_date"]
    for (const key of numberKeys) {
      if (event[key]) event[key] = event[key].toInt()
    }
    for (const key of dateKeys) {
      if (event[key]) event[key] = event[key]
    }
    return event
  })

  return results
})
