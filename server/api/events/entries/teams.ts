export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
    MATCH (f:Entry WHERE f.id STARTS WITH $id)
    CALL (f, e, ed) {
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(f)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      WITH p, CASE WHEN z IS NULL THEN properties(c) ELSE properties(c1) END AS country, t
      RETURN COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), {country: country, rank: t.rank})) AS team
    }
    CALL (f) {
      OPTIONAL MATCH (f)-[:SCORED]->(s:Score:Main)
      OPTIONAL MATCH (f)-[:SCORED]->(s2:Score:Qualifying)
      RETURN
        CASE
          WHEN s IS NOT NULL AND s2 IS NOT NULL THEN ['Main', 'Qualifying']
          WHEN s IS NOT NULL THEN ['Main']
          WHEN s2 IS NOT NULL THEN ['Qualifying']
          ELSE []
        END AS draws
    }
    WITH team, draws, CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END AS type, properties(f) AS entry
    RETURN DISTINCT apoc.map.merge(
      entry,
      {
        type: type,
        team: team,
        draws: draws
      }
    ) AS entry
    ORDER BY entry.team[0].last_name, entry.team[0].first_name
    `,
    { id: `${edId}-${tour}` }
  )

  console.log(
    `Notifications for entries: `,
    summary.gqlStatusObjects.filter(s => !["00000", "01N51", "01N52"].includes(s.gqlStatus))
  )

  const results = records.map(record => {
    const entry = record.get("entry")
    const numberKeys = ["seed", "q_seed"]

    for (const key of numberKeys) {
      if (entry[key]) entry[key] = entry[key].toInt()
    }

    for (const player of entry.team) {
      if (player.rank) player.rank = player.rank.toInt()
    }

    return entry
  })

  return results
})
