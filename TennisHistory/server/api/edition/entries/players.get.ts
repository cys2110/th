import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery<{ edId: string }>(event)

    const { records } = await useDriver().executeQuery(
      `/* cypher */
      MATCH (e:Event)-[:EVENT_OF]->(ed:Edition {id: $id})
      MATCH (p:Player)-[t:ENTERED]->(f:Entry WHERE f.id STARTS WITH e.id)
      OPTIONAL MATCH (p)-[:REPRESENTS]->(c:Country)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)

      WITH p, coalesce(properties(c1), properties(c)) AS country, e
      CALL (p, e) {
        OPTIONAL MATCH (p)-[t:ENTERED]->(f:Entry&Singles WHERE f.id STARTS WITH e.id)
        OPTIONAL MATCH (f)-[:SCORED]->(s:Score&Main)
        OPTIONAL MATCH (f)-[:SCORED]->(s2:Score&Qualifying)
        WITH
          CASE
            WHEN s IS NOT NULL AND s2 IS NOT NULL THEN ['Main', 'Qualifying']
            WHEN s IS NOT NULL THEN ['Main']
            WHEN s2 IS NOT NULL THEN ['Qualifying']
            ELSE []
          END AS draws, properties(f) AS entry, t
        RETURN apoc.map.clean(apoc.map.merge(entry, {draws: draws, rank: t.rank}), [], [null, []]) AS singles
      }
      CALL (p, e) {
        OPTIONAL MATCH (p)-[t:ENTERED]->(f:Entry&Doubles WHERE f.id STARTS WITH e.id)
        OPTIONAL MATCH (f)-[:SCORED]->(s:Score&Main)
        OPTIONAL MATCH (f)-[:SCORED]->(s2:Score&Qualifying)
        WITH
          CASE
            WHEN s IS NOT NULL AND s2 IS NOT NULL THEN ['Main', 'Qualifying']
            WHEN s IS NOT NULL THEN ['Main']
            WHEN s2 IS NOT NULL THEN ['Qualifying']
            ELSE []
          END AS draws, properties(f) AS entry, t
        RETURN apoc.map.clean(apoc.map.merge(entry, {draws: draws, rank: t.rank}), [], [null, []]) AS doubles
      }
      WITH singles, doubles, p, country, [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
      RETURN DISTINCT apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
          {
            country: country,
            singles: singles,
            doubles: doubles,
            tour: tour
          }
        ), [], [{}]
      ) AS entry
      ORDER BY toLower(entry.last_name), toLower(entry.first_name)
    `,
      { id: int(edId) }
    )

    const results = records.map(record => {
      const entry = record.get("entry")

      return playerEntrySchema.parse(entry)
    })

    return results
  } catch (error) {
    throw error
  }
})
