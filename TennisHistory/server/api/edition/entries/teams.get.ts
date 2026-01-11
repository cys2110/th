import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery<{ edId: string }>(event)

    const { records } = await useDriver().executeQuery(
      `/* cypher */
      MATCH (e:Event)-[:EVENT_OF]->(ed:Edition {id: $id})
      MATCH (f:Entry WHERE f.id STARTS WITH e.id)

      CALL (f, e, ed) {
        MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(f)
        OPTIONAL MATCH
          (p)-
            [z:REPRESENTED WHERE
              z.start_date <= coalesce(e.start_date, ed.start_date) AND
              z.end_date > coalesce(e.start_date, ed.start_date)]->
          (c1:Country)
        WITH p, coalesce(properties(c1), properties(c)) AS country, t
        RETURN
          SUM(t.rank) AS rank,
          COLLECT(
            DISTINCT
            apoc.map.clean(
              apoc.map.merge(
                apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
                {country: country, rank: t.rank}
              ),
              [],
              [null]
            )) AS team
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

      WITH
        team,
        draws,
        CASE
          WHEN f:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        properties(f) AS entry,
        rank,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
      RETURN DISTINCT
        apoc.map.clean(
          apoc.map.merge(entry, {type: type, team: team, draws: draws, rank: rank, tour: tour}),
          [],
          [null]
        ) AS entry
      ORDER BY (CASE
          WHEN entry.rank = 0 THEN 1
          ELSE 0
        END), entry.rank
    `,
      { id: int(edId) }
    )

    const results = records.map(record => {
      const entry = record.get("entry")
      return teamEntrySchema.parse(entry)
    })

    return results
  } catch (error) {
    throw error
  }
})
