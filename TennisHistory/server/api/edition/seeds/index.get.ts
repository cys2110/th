import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery<{ edId: string }>(event)

    const query = `/* cypher */
      MATCH
        (ed:Edition {id: $id})<-[:EVENT_OF]-
        (e:Event)<-[v:SEEDED|Q_SEEDED]-
        (f:Entry)

      CALL (f, e) {
        OPTIONAL MATCH (f)-[u:WITHDREW|Q_WITHDREW]->(e)
        RETURN
          CASE
            WHEN u IS NOT NULL THEN true
            ELSE false
          END AS withdrew
      }

      CALL (f, e, ed) {
        MATCH (f)<-[:ENTERED]-(p:Player)-[:REPRESENTS]-(c:Country)

        OPTIONAL MATCH
          (p)-
            [z:REPRESENTED WHERE
              (z.start_date <= coalesce(e.start_date, ed.start_date) AND
                z.end_date > coalesce(e.start_date, ed.start_date))]->
          (c1:Country)

        WITH p, coalesce(properties(c1), properties(c)) AS country

        RETURN
          COLLECT(
            DISTINCT
            apoc.map.merge(
              apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
              {country: country}
            )) AS players
      }

      WITH
        withdrew,
        players,
        CASE
          WHEN v:SEEDED THEN 'Main'
          ELSE 'Qualifying'
        END AS draw,
        v.rank AS rank,
        CASE
          WHEN f:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        properties(f) AS entry,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
      ORDER BY type DESC, draw, entry.seed, entry.q_seed
      RETURN
        apoc.map.clean(
          apoc.map.merge(
            entry,
            {
              withdrew: withdrew,
              team: players,
              draw: draw,
              rank: rank,
              type: type,
              seed: coalesce(entry.seed, entry.q_seed),
              tour: tour
            }
          ),
          [],
          [null]
        ) AS seed
  `

    const { records } = await useDriver().executeQuery(query, { id: int(edId) })

    const results = records.map(r => {
      const seed = r.get("seed")
      return seedSchema.parse(seed)
    })

    return results
  } catch (error) {
    throw error
  }
})
