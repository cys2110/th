export default defineEventHandler(async event => {
  const { edId, tour } = getQuery<{ edId: string; tour: string }>(event)

  const query = `/* cypher */
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
      RETURN coalesce(properties(c), properties(c1)) AS country
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
        apoc.map.clean(
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
          ), [], [null]
        )
        END AS seed
  `

  const { records } = await useDriver().executeQuery(query, { id: `${edId}-${tour}` })

  const results = records.filter(Boolean).map(r => {
    const seed = r.get("seed")
    if (!seed) return null

    return seedSchema.parse(seed)
  })

  return results.filter(Boolean) as SeedType[]
})
