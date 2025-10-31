export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
    MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(f:Entry WHERE f.id STARTS WITH $id)
    OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
    CALL (f, t) {
      CALL (*) {
        WITH f, t WHERE f:Singles
        OPTIONAL MATCH (f)-[:SCORED]->(s:Score:Main)
        OPTIONAL MATCH (f)-[:SCORED]->(s2:Score:Qualifying)
        WITH
          CASE
            WHEN s IS NOT NULL AND s2 IS NOT NULL THEN ['Main', 'Qualifying']
            WHEN s IS NOT NULL THEN ['Main']
            WHEN s2 IS NOT NULL THEN ['Qualifying']
            ELSE []
          END AS draws, properties(f) AS entry, t
        RETURN apoc.map.merge(entry, {draws: draws, rank: t.rank}) AS singles
        UNION
        WITH f, t WHERE NOT f:Singles
        RETURN NULL AS singles
      }
      RETURN singles
    }
    CALL (f, t) {
      CALL (*) {
        WITH f, t WHERE f:Doubles
        OPTIONAL MATCH (f)-[:SCORED]->(s:Score:Main)
        OPTIONAL MATCH (f)-[:SCORED]->(s2:Score:Qualifying)
        WITH
          CASE
            WHEN s IS NOT NULL AND s2 IS NOT NULL THEN ['Main', 'Qualifying']
            WHEN s IS NOT NULL THEN ['Main']
            WHEN s2 IS NOT NULL THEN ['Qualifying']
            ELSE []
          END AS draws, properties(f) AS entry, t
        RETURN apoc.map.merge(entry, {draws: draws, rank: t.rank}) AS doubles
        UNION
        WITH f, t WHERE NOT f:Doubles
        RETURN NULL AS doubles
      }
      RETURN doubles
    }
    WITH singles, doubles, p, CASE WHEN z IS NULL THEN properties(c) ELSE properties(c1) END AS country
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
    summary.gqlStatusObjects.filter(s => !["00000", "01N51", "01N52"].includes(s.gqlStatus))
  )

  const results = records.map(record => {
    const entry = record.get("entry")
    const numberKeys = ["seed", "q_seed", "rank"]

    for (const key of numberKeys) {
      if (entry.singles?.[key]) entry.singles[key] = entry.singles[key].toInt()
      if (entry.doubles?.[key]) entry.doubles[key] = entry.doubles[key].toInt()
    }

    return entry
  })

  return results
})
