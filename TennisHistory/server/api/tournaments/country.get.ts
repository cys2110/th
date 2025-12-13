import { int } from "neo4j-driver"

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
        (p:Player)
      CALL (e, p, ed) {
        OPTIONAL MATCH
          (p)-
            [z:REPRESENTED WHERE z.start_date <= coalesce(ed.start_date, e.start_date) AND
              z.end_date > coalesce(ed.start_date, e.start_date)]->
          (c1:Country)
        MATCH (p)-[:REPRESENTS]->(c:Country)
        RETURN
          coalesce(properties(c1), properties(c)) AS country
      }
      WITH
        country,
        MIN(e.start_date) AS first_win_date,
        COUNT(DISTINCT p) AS wins,
        COUNT(DISTINCT
          CASE
            WHEN p:ATP AND f:Singles THEN p
            ELSE null
          END) AS atp_singles_wins,
        COUNT(DISTINCT
          CASE
            WHEN p:ATP AND f:Doubles THEN p
            ELSE null
          END) AS atp_doubles_wins,
        COUNT(DISTINCT
          CASE
            WHEN p:WTA AND f:Singles THEN p
            ELSE null
          END) AS wta_singles_wins,
        COUNT(DISTINCT
          CASE
            WHEN p:WTA AND f:Doubles THEN p
            ELSE null
          END) AS wta_doubles_wins,
        COUNT(
          CASE
            WHEN p:ATP AND f:Singles THEN p
            ELSE null
          END) AS total_atp_singles_wins,
        COUNT(
          CASE
            WHEN p:ATP AND f:Doubles THEN p
            ELSE null
          END) AS total_atp_doubles_wins,
        COUNT(
          CASE
            WHEN p:WTA AND f:Singles THEN p
            ELSE null
          END) AS total_wta_singles_wins,
        COUNT(
          CASE
            WHEN p:WTA AND f:Doubles THEN p
            ELSE null
          END) AS total_wta_doubles_wins
      ORDER BY wins DESC, first_win_date ASC
      RETURN
        properties(country) AS country,
        atp_singles_wins,
        atp_doubles_wins,
        wta_singles_wins,
        wta_doubles_wins,
        total_atp_singles_wins,
        total_atp_doubles_wins,
        total_wta_singles_wins,
        total_wta_doubles_wins
    `,
    { id: int(id) }
  )

  const results = records.map(record => {
    const result = record.toObject()
    return tournamentCountrySchema.parse(result)
  })

  return results
})
