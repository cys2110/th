export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (e:Event {id: $id})
      OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)
      OPTIONAL MATCH (sup:Supervisor)-[:SUPERVISED]->(e)
      WITH DISTINCT
        e,
        properties(s) AS surface,
        COLLECT(DISTINCT apoc.map.merge(properties(v), {country: properties(c)})) AS venues,
        COLLECT(DISTINCT properties(sup)) AS supervisors
      RETURN
        apoc.map.merge(
          properties(e),
          {surface: surface, venues: venues, supervisors: supervisors}
        ) AS event
    `,
    { id: Number(id) }
  )

  const results = records[0].get("event")

  const dateKeys = [
    "start_date",
    "end_date",
    "atp_start_date",
    "atp_end_date",
    "wta_start_date",
    "wta_end_date",
    "men_start_date",
    "men_end_date",
    "women_start_date",
    "women_end_date"
  ]

  for (const key of dateKeys) {
    if (results[key])
      results[key] = {
        year: results[key].year.toInt(),
        month: results[key].month.toInt(),
        day: results[key].day.toInt()
      }
  }

  if (results.tfc) results.tfc = results.tfc.toInt()

  return results
})
