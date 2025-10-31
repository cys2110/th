export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (:Tournament {id: $id})<-[:EDITION_OF]-
        (e:Event)<-[:ROUND_OF]-
        (:Round {round: 'Final'})<-[:PLAYED]-
        (:Match)<-[:SCORED]-
        (s:Score)<-[:SCORED]-
        (:Entry)<-[:ENTERED]-
        (p:Player)-[:REPRESENTS]->
        (c:Country)
      OPTIONAL MATCH
        (p)-
          [z:REPRESENTED WHERE
            (z.start_date <= e.start_date OR
              ('ATP' IN labels(p) AND
                z.start_date <= coalesce(e.atp_start_date, e.men_start_date)) OR
              ('WTA') IN labels(p) AND
              z.start_date <= coalesce(e.wta_start_date, e.women_start_date)) AND
            (z.end_date > e.start_date OR
              ('ATP' IN labels(p) AND
                z.end_date > coalesce(e.atp_start_date, e.men_start_date) OR
                ('WTA' IN labels(p) AND
                  z.end_date > coalesce(e.wta_start_date, e.women_start_date))))]->
        (c1:Country)
      WITH
        p,
        COUNT(*) AS finals,
        CASE
          WHEN z IS NULL THEN properties(c)
          ELSE properties(c1)
        END AS country,
        SUM(
          CASE
            WHEN s:Loser AND s:Singles THEN 1
            ELSE 0
          END) AS singles_losses,
        SUM(
          CASE
            WHEN s:Winner AND s:Singles THEN 1
            ELSE 0
          END) AS singles_wins,
        SUM(
          CASE
            WHEN s:Loser AND s:Doubles THEN 1
            ELSE 0
          END) AS doubles_losses,
        SUM(
          CASE
            WHEN s:Winner AND s:Doubles THEN 1
            ELSE 0
          END) AS doubles_wins
      ORDER BY finals DESC, singles_wins DESC, doubles_wins DESC, singles_losses, doubles_losses
      RETURN
        finals,
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name']),
          {
            country: country,
            tour: [x IN labels(p) WHERE NOT x IN ['Update', 'Player', 'Coach']][0]
          }
        ) AS player,
        singles_losses,
        singles_wins,
        doubles_losses,
        doubles_wins
    `,
    { id: Number(id) }
  )

  const results = records.map(record => {
    const { finals, player, singles_wins, singles_losses, doubles_wins, doubles_losses } = record.toObject()
    return {
      finals: finals.toInt(),
      player,
      singles_wins: singles_wins.toInt(),
      singles_losses: singles_losses.toInt(),
      doubles_wins: doubles_wins.toInt(),
      doubles_losses: doubles_losses.toInt()
    }
  })

  return results
})
