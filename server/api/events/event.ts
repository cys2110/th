export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)
    OPTIONAL MATCH (ed)-[:ON_SURFACE]->(s1:Surface)
    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (ed)-[:TOOK_PLACE_IN]->(v1:Venue)-[:LOCATED_IN]->(c1:Country)
    OPTIONAL MATCH (sup:Supervisor)-[:SUPERVISED]->(e)
    WITH e, ed, t, properties(s) AS surface, properties(s1) AS edition_surface, COLLECT(DISTINCT apoc.map.clean(apoc.map.merge(properties(v), {country: properties(c)}), [], [{}])) AS venues, COLLECT(DISTINCT apoc.map.clean(apoc.map.merge(properties(v1), {country: properties(c1)}), [], [{}])) AS edition_venues, COLLECT(DISTINCT properties(sup)) AS supervisors
    RETURN apoc.map.merge(properties(e), {
      tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0],
      level: [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0],
      venues: venues,
      surface: surface,
      supervisors: supervisors,
      edition: {
        id: ed.id,
        sponsor_name: ed.sponsor_name,
        tournament: properties(t),
        venues: edition_venues,
        surface: edition_surface,
        category: ed.category,
        start_date: ed.start_date,
        end_date: ed.end_date,
        currency: ed.currency,
        tfc: ed.tfc,
        wiki_link: ed.wiki_link
      }
    }) AS event
    `,
    { id }
  )

  console.log(
    `Notifications for events: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  const results = records[0].get("event")
  const numberKeys = ["pm", "tfc"]
  const dateKeys = ["start_date", "end_date", "updated_at"]

  for (const key of numberKeys) {
    if (results[key]) results[key] = results[key].toInt()
    if (results["edition"][key]) results["edition"][key] = results["edition"][key].toInt()
  }

  for (const key of dateKeys) {
    if (results[key]) {
      results[key] = results[key].toStandardDate().toISOString().slice(0, 10)
    }
    if (results["edition"][key]) {
      results["edition"][key] = results["edition"][key].toStandardDate().toISOString().slice(0, 10)
    }
  }

  if (results["venues"].length === 1 && Object.keys(results["venues"][0]).length === 0) {
    delete results["venues"]
  }
  if (results["edition"]["venues"].length === 1 && Object.keys(results["edition"]["venues"][0]).length === 0) {
    delete results["edition"]["venues"]
  }

  results["edition"]["tournament"]["id"] = results["edition"]["tournament"]["id"].toInt()

  return results
})
