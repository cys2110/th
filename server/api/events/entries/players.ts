export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
    MATCH (p:Player)-[:ENTERED]->(f:Entry WHERE f.id STARTS WITH $id)
    OPTIONAL MATCH (p)-[:REPRESENTS]->(c:Country)
    OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
    WITH p, coalesce(properties(c1), properties(c), null) AS country
    CALL (p) {
      CALL (*) {
        OPTIONAL MATCH (p)-[t:ENTERED]->(f:Entry:Singles {id: $id || ' ' || p.id})
        OPTIONAL MATCH (f)-[w1:SCORED]->(s:Score:Main)
        OPTIONAL MATCH (f)-[w2:SCORED]->(s2:Score:Qualifying)
        WITH
          CASE
            WHEN s IS NOT NULL AND s2 IS NOT NULL THEN ['Main', 'Qualifying']
            WHEN s IS NOT NULL THEN ['Main']
            WHEN s2 IS NOT NULL THEN ['Qualifying']
            ELSE []
          END AS draws, properties(f) AS entry,
          CASE
            WHEN w1 IS NULL AND w2 IS NULL THEN true
            ELSE false
          END AS withdrew, t
        RETURN CASE WHEN t IS NULL THEN NULL ELSE apoc.map.merge(entry, {draws: draws, rank: t.rank, withdrew: withdrew}) END AS singles
      }
      CALL (*) {
        OPTIONAL MATCH (p)-[t:ENTERED]->(f:Entry:Doubles WHERE f.id STARTS WITH $id)
        OPTIONAL MATCH (f)-[w1:SCORED]->(s:Score:Main)
        OPTIONAL MATCH (f)-[w2:SCORED]->(s2:Score:Qualifying)
        WITH
          CASE
            WHEN s IS NOT NULL AND s2 IS NOT NULL THEN ['Main', 'Qualifying']
            WHEN s IS NOT NULL THEN ['Main']
            WHEN s2 IS NOT NULL THEN ['Qualifying']
            ELSE []
          END AS draws, properties(f) AS entry,
          CASE
            WHEN w1 IS NULL AND w2 IS NULL THEN true
            ELSE false
          END AS withdrew, t
        RETURN CASE WHEN t IS NULL THEN NULL ELSE apoc.map.merge(entry, {draws: draws, rank: t.rank, withdrew: withdrew}) END AS doubles
      }
      RETURN singles, doubles
    }
    RETURN DISTINCT apoc.map.merge(
      apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
      {
        country: country,
        singles: singles,
        doubles: doubles
      }
    ) AS entry
    ORDER BY entry.last_name, entry.first_name
    `,
    { id: `${edId}-${tour}` }
  )

  console.log(
    `Notifications for entries: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  const results = records.map(record => {
    const entry = record.get("entry")
    const numberKeys = ["seed", "q_seed", "rank", "points", "pm"]

    for (const key of numberKeys) {
      if (entry.singles?.[key]) entry.singles[key] = entry.singles[key].toInt()
      if (entry.doubles?.[key]) entry.doubles[key] = entry.doubles[key].toInt()
    }

    return entry
  })

  return results
})
