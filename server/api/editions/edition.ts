import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { edId } = getQuery<{ edId: string }>(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (e:Edition {id: $id})-[:EDITION_OF]->(t:Tournament)
    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)
    CALL (e, v, c) {
      WHEN v IS NULL THEN RETURN null AS venues
      ELSE RETURN COLLECT(DISTINCT apoc.map.merge(properties(v), { country: properties(c)})) AS venues
    }
    RETURN apoc.map.clean(apoc.map.merge(properties(e), { venues: venues, surface: properties(s), tours: [x IN labels(e) WHERE x <> 'Edition'], tournament: properties(t) }), [], [null]) AS edition
    `,
    { id: int(edId) }
  )

  console.log(
    `Notifications for editions: `,
    summary.gqlStatusObjects.filter(s => !["00000", "01N51"].includes(s.gqlStatus))
  )

  const results = records[0].get("edition")
  const numberKeys = ["id", "tfc"]
  const dateKeys = ["start_date", "end_date", "updated_at"]

  for (const key of numberKeys) {
    if (results[key]) results[key] = results[key].toInt()
  }

  for (const key of dateKeys) {
    if (results[key]) {
      results[key] = results[key].toStandardDate().toISOString().slice(0, 10)
    }
  }

  results["tournament"]["id"] = results["tournament"]["id"].toInt()

  return results
})
