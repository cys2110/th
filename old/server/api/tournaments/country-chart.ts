export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (:Tournament {id: $id})<-[:EDITION_OF]-
        (e:Event)<-[:ROUND_OF]-
        (:Round {round: 'Final'})<-[:PLAYED]-
        (:Match)<-[:SCORED]-
        (:Winner)<-[:SCORED]-
        (f:Entry)<-[:ENTERED]-
        (p:Player)-[:REPRESENTS]->
        (c:Country)
      MATCH (e)-[:IN_YEAR]->(y:Year)
      WITH c, y, p, f
      ORDER BY y.id
      RETURN {
        country: c.name,
        year: toString(y.id),
        player: p.id,
        tour: [x IN labels(p) WHERE NOT x IN ['Update', 'Coach', 'Player']][0],
        type:
          CASE
            WHEN f:Singles THEN 'Singles'
            ELSE 'Doubles'
          END
      } AS country
    `,
    { id: Number(id) }
  )

  const results = records.map(record => record.get("country"))

  return results
})
