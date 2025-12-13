import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { edId } = getQuery<{ edId: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (ed:Edition {id: $id})-[:EDITION_OF]->(t:Tournament)
    OPTIONAL MATCH (ed)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (ed)-[:ON_SURFACE]->(s:Surface)

    CALL (ed) {
      OPTIONAL MATCH (e:Event)-[:EVENT_OF]->(ed)
      OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(ev:Venue)-[:LOCATED_IN]->(ec:Country)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)
      OPTIONAL MATCH (e)<-[:SUPERVISED]-(sup:Supervisor)

      WITH
        e,
        es,
        CASE
          WHEN COUNT(ev) = 0 THEN []
          ELSE
            COLLECT(
              DISTINCT
              apoc.map.merge(properties(ev), {county: properties(ec)}))
        END AS venues,
        COLLECT(DISTINCT properties(sup)) AS supervisors

      RETURN DISTINCT CASE WHEN e IS NULL THEN NULL ELSE
        apoc.map.clean(
          apoc.map.merge(
            properties(e),
            {
              venues: venues,
              surface: properties(es),
              tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0],
              level: [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0],
              supervisors: supervisors
            }
          ),
          [],
          [null, []]
        ) END AS event
    }

    WITH
      CASE
        WHEN COUNT(v) = 0 THEN []
        ELSE
          COLLECT(DISTINCT apoc.map.merge(properties(v), {country: properties(c)}))
      END AS venues,
      ed,
      properties(s) AS surface,
      apoc.map.merge(
        apoc.map.submap(t, ['id', 'name']),
        {tours: [x IN labels(t) WHERE x <> 'Tournament']}
      ) AS tournament,
      COLLECT(event) AS events

    RETURN
      apoc.map.clean(
        apoc.map.merge(
          properties(ed),
          {
            venues: venues,
            surface: surface,
            tours: [x IN labels(ed) WHERE x <> 'Edition'],
            tournament: tournament,
            events: events
          }
        ),
        [],
        [null]
      ) AS edition
    `,
    { id: int(edId) }
  )

  const results = records[0].get("edition")

  return editionDetailsSchema.parse(results)
})
