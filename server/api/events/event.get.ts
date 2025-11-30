export default defineEventHandler(async event => {
  const { edId, tour } = getQuery<{ edId: string; tour: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)
    OPTIONAL MATCH (ed)-[:ON_SURFACE]->(s1:Surface)
    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (ed)-[:TOOK_PLACE_IN]->(v1:Venue)-[:LOCATED_IN]->(c1:Country)
    OPTIONAL MATCH (sup:Supervisor)-[:SUPERVISED]->(e)

    WITH
      e,
      ed,
      s1,
      s,
      CASE
        WHEN COUNT(v1) > 0 THEN COLLECT(DISTINCT apoc.map.merge(properties(v1), {country: properties(c1)}))
        ELSE []
      END AS edition_venues,
      CASE
        WHEN COUNT(v) > 0 THEN COLLECT(DISTINCT apoc.map.merge(properties(v), {country: properties(c)}))
        ELSE []
      END AS venues,
      COLLECT(DISTINCT properties(sup)) AS supervisors,
      apoc.map.merge(
        properties(t),
        {
          tours: [x IN labels(t) WHERE x <> 'Tournament']
        }
      ) AS tournament

    WITH
      e,
      s,
      venues,
      supervisors,
      apoc.map.clean(
        apoc.map.merge(
          properties(ed),
          {
            tournament: tournament,
            surface: properties(s1),
            venues: edition_venues
          }
        ), [], [null]
      ) AS edition

    RETURN apoc.map.clean(
      apoc.map.merge(
        properties(e),
        {
          edition: edition,
          supervisors: supervisors,
          surface: properties(s),
          venues: venues,
          level: [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0],
          tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0]
        }
      ), [], [null]
    ) AS event
    `,
    { id: `${edId}-${tour}` }
  )

  const results = records[0].get("event")

  return eventSchema.parse(results)
})
