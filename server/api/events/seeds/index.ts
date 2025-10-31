export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    OPTIONAL MATCH (ed:Edition)<-[:EVENT_OF]-(e:Event {id: $id})<-[v:SEEDED|Q_SEEDED]-(f:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]-(c:Country)
    CALL (f, e) {
      OPTIONAL MATCH (f)-[u:WITHDREW|Q_WITHDREW]->(e)
      RETURN
        CASE
          WHEN u IS NOT NULL THEN true
          ELSE false
        END AS withdrew
    }
    CALL (p, e, ed, c) {
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE (
        z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)
      )]->(c1:Country)
      RETURN
        CASE
          WHEN z IS NULL THEN properties(c)
          ELSE properties(c1)
        END AS country
    }
    WITH
      withdrew,
      COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), { country: country })) AS team,
      CASE WHEN v:SEEDED THEN 'Main' ELSE 'Qualifying' END AS draw,
      v.rank AS rank,
      CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END AS type,
      properties(f) AS entry
    ORDER BY type DESC, draw, entry.seed, entry.q_seed
    RETURN DISTINCT
      CASE
        WHEN entry IS NULL THEN NULL
        ELSE
          apoc.map.merge(
            entry,
            {
              withdrew: withdrew,
              team: team,
              draw: draw,
              rank: rank,
              type: type,
              seed: coalesce(entry.seed, entry.q_seed)
            }
          )
        END AS seed
    `,
    { id: `${edId}-${tour}` }
  )

  console.log(
    `Notifications for events: `,
    summary.gqlStatusObjects.filter(s => !["00000", "01N51", "01N52"].includes(s.gqlStatus))
  )

  const results = records.filter(Boolean).map(r => {
    const seed = r.get("seed")
    if (!seed) return null
    const numberKeys = ["seed", "rank", "q_seed"]
    for (const key of numberKeys) {
      if (seed[key]) seed[key] = seed[key].toInt()
    }

    return seed
  })

  return results.filter(Boolean)
})
