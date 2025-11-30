import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { edId } = getQuery<{ edId: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (e:Edition {id: $id})-[:EDITION_OF]->(t:Tournament)
    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)

    CALL (e, v, c) {
      WHEN v IS NULL THEN RETURN [] AS venues
      ELSE RETURN COLLECT(DISTINCT apoc.map.merge(properties(v), { country: properties(c)})) AS venues
    }

    WITH
      venues,
      e,
      properties(s) AS surface,
      apoc.map.merge(
        properties(t),
        {
          tours: [x IN labels(t) WHERE x <> 'Tournament']
        }
      ) AS tournament

    RETURN apoc.map.clean(
      apoc.map.merge(
        properties(e),
        {
          venues: venues,
          surface: surface,
          tours: [x IN labels(e) WHERE x <> 'Edition'],
          tournament: tournament
        }
      ),
      [],
      [null]
    ) AS edition
    `,
    { id: int(edId) }
  )

  const results = records[0].get("edition")

  return editionSchema.parse(results)
})
