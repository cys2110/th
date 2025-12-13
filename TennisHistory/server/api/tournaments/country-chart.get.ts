export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (:Tournament {id: $id})<-[:EDITION_OF]-
        (ed:Edition)<-[:EVENT_OF]-
        (e:Event)<-[:ROUND_OF]-
        (:Round {round: 'Final'})<-[:PLAYED]-
        (:Match)<-[:SCORED]-
        (:Winner)<-[:SCORED]-
        (f:Entry)<-[:ENTERED]-
        (p:Player)-[:REPRESENTS]->
        (c:Country)
      MATCH (ed)-[:IN_YEAR]->(y:Year)
      WITH c, y, p, f
      ORDER BY y.id
      RETURN {
        country: c.name,
        year: y.id,
        player: p.id,
        tour: [x IN labels(p) WHERE NOT x IN ['Coach', 'Player']][0],
        type:
          CASE
            WHEN f:Singles THEN 'Singles'
            ELSE 'Doubles'
          END
      } AS country
    `,
    { id: Number(id) }
  )

  const results = records.map(record => {
    const result = record.get("country")
    return tournamentCountryChartSchema.parse(result)
  })

  return results
})
