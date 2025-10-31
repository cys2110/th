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
    WITH e, ed, t, CASE WHEN s IS NULL THEN properties(s1) ELSE properties(s) END AS surface, CASE WHEN COUNT(v) = 0 THEN COLLECT(DISTINCT apoc.map.merge(properties(v1), {country: properties(c1)})) ELSE COLLECT(DISTINCT apoc.map.merge(properties(v), {country: properties(c)})) END AS venues, COLLECT(DISTINCT properties(sup)) AS supervisors
    RETURN {
      tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0],
      level: [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0],
      sponsor_name: coalesce(e.sponsor_name, ed.sponsor_name),
      venues: venues,
      surface: surface,
      supervisors: supervisors,
      category: coalesce(e.category, ed.category),
      start_date: coalesce(e.start_date, ed.start_date),
      end_date: coalesce(e.end_date, ed.end_date),
      currency: coalesce(e.currency, ed.currency),
      pm: e.pm,
      tfc: coalesce(e.tfc, ed.tfc, null),
      s_draw: e.s_draw,
      d_draw: e.d_draw,
      site_link: e.site_link,
      wiki_link: ed.wiki_link,
      edition: {
        id: ed.id,
        tournament: properties(t)
      }
    } AS event
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
  }

  for (const key of dateKeys) {
    if (results[key]) {
      results[key] = results[key].toStandardDate().toISOString().slice(0, 10)
    }
  }

  results["edition"]["id"] = results["edition"]["id"].toInt()
  results["edition"]["tournament"]["id"] = results["edition"]["tournament"]["id"].toInt()

  return results
})
