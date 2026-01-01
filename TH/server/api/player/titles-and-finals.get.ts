export default defineEventHandler(async event => {
  const params = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH
        (p)-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (m:Match)-[:PLAYED]->
        (:Round {round: 'Final'})-[:ROUND_OF]->
        (e:Event)-[:EVENT_OF]-(ed:Edition)-[:IN_YEAR]->
        (y:Year)
      OPTIONAL MATCH (ed)-[:EDITION_OF]->(t:Tournament)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)
      WITH
        *,
        CASE
          WHEN m:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        CASE
          WHEN s:Winner THEN true
          ELSE false
        END AS title,
        coalesce(e.start_date, ed.start_date) AS start_date,
        coalesce(e.end_date, ed.end_date) AS end_date,
        coalesce(properties(eds), properties(es)) AS surface,
        [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0] AS level
      WHERE e IS NOT NULL
      ORDER BY start_date
      RETURN {
        id: e.id,
        tournament: properties(t),
        type: type,
        category: coalesce(e.category, ed.category),
        year: y.id,
        start_date: start_date,
        end_date: end_date,
        surface: surface,
        level: level,
        title: title
      } AS tournament
    `,
    params
  )

  const results = records.map(record => {
    const event = record.get("tournament")
    return titlesAndFinalsSchema.parse(event)
  })

  return results
})
