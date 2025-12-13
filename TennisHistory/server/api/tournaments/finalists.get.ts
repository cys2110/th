import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (:Tournament {id: $id})<-[:EDITION_OF]-
        (ed:Edition)<-[:EVENT_OF]-
        (e:Event)<-[:ROUND_OF]-
        (:Round {round: 'Final'})<-[:PLAYED]-
        (:Match)<-[:SCORED]-
        (s:Score)<-[:SCORED]-
        (:Entry)<-[:ENTERED]-
        (p:Player)-[:REPRESENTS]->
        (c:Country)
      OPTIONAL MATCH
        (p)-
          [z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->
        (c1:Country)
      WITH
        p,
        COUNT(*) AS finals,
        coalesce(properties(c1), properties(c)) AS country,
        COUNT(CASE WHEN s:Loser and s:Singles THEN s END) AS singles_losses,
        COUNT(CASE WHEN s:Winner AND s:Singles THEN s END) AS singles_wins,
        COUNT(CASE WHEN s:Loser AND s:Doubles THEN s END) AS doubles_losses,
        COUNT(CASE WHEN s:Winner AND s:Doubles THEN s END) AS doubles_wins
      ORDER BY finals DESC, singles_wins DESC, doubles_wins DESC, singles_losses, doubles_losses
      RETURN
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name']),
          {
            country: country,
            tour: [x IN labels(p) WHERE NOT x IN ['Player', 'Coach']][0],
            singles_wins: singles_wins,
            singles_losses: singles_losses,
            doubles_wins: doubles_wins,
            doubles_losses: doubles_losses
          }
        ) AS player
    `,
    { id: int(id) }
  )

  const results = records.map(record => {
    const result = record.get("player")
    return tournamentFinalistSchema.parse(result)
  })

  return results
})
