export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH
      (f:Entry WHERE f.status IN ['Q', 'LL', 'AL', 'WC'])-[:SCORED]->
      (:Winner)-[:SCORED]->
      (m:Match)-[:PLAYED]->
      (:Round {round: 'Final'})-[:ROUND_OF]->
      (e:Event)-[:EVENT_OF]-
      (ed:Edition)-[:EDITION_OF]->
      (:Tournament {id: $id})
    MATCH (ed)-[:IN_YEAR]->(y:Year)
    ORDER BY y.id

    CALL (f, e, ed) {
      MATCH
      (c:Country)<-[:REPRESENTS]-
      (p:Player)-[:ENTERED]->(f)
      OPTIONAL MATCH (p)-[t:REPRESENTED WHERE t.start_date <= coalesce(e.start_date, ed.start_date) AND t.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)

      RETURN COLLECT(DISTINCT apoc.map.merge(
        apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
        { country: coalesce(properties(c1), properties(c)) }
      )) AS players
    }
    WITH
      f.status AS status,
      y.id AS year,
      ed.id AS edId,
      CASE
        WHEN m:Singles THEN 'Singles'
        ELSE 'Doubles'
      END AS type,
      players,
      [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
    RETURN
      {
        tour: tour,
        status: status,
        year: year,
        type: type,
        id: edId,
        team: players
      } AS winner
    `,
    { id: Number(id) }
  )

  const results = records.map(record => {
    const result = record.get("winner")
    return tournamentStatusSchema.parse(result)
  })

  return results
})
