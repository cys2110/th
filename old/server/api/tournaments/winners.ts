export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH
        (t:Tournament {id: $id})<-[:EDITION_OF]-
        (e:Event
          WHERE
          coalesce(
            e.start_date,
            e.atp_start_date,
            e.wta_start_date,
            e.men_start_date,
            e.women_start_date
          ) IS
          NOT
          NULL)-
          [:IN_YEAR]->
        (y:Year)
      CALL (*) {
        WHEN e.draw_type = 'Country draw' THEN {
          OPTIONAL MATCH
            (x:Tie)-[:TIE_OF]->(r:Round {round: 'Final'})-[:ROUND_OF]->(e)
          MATCH (c1:Country {id: x.c1})
          MATCH (c2:Country {id: x.c2})
          WITH c1, c2, split(x.score, '-') AS scoreArray, x.score AS score
          RETURN
            CASE
              WHEN
                scoreArray[0] > scoreArray[1]
                THEN {winner: properties(c1), loser: properties(c2), score: score}
              ELSE
                {
                  winner: properties(c2),
                  loser: properties(c1),
                  score: toString(scoreArray[1]) || '-' || toString(scoreArray[0])
                }
            END AS final }
        ELSE {
          OPTIONAL MATCH
            (m:Match)-[:PLAYED]->(r:Round {round: 'Final'})-[:ROUND_OF]->(e)
          OPTIONAL MATCH
            (q:Country)<-[:REPRESENTS]-
            (winner:Player)-[:ENTERED]->
            (:Entry)-[:SCORED]->
            (ws:Winner)-[:SCORED]->
            (m)<-[:SCORED]-
            (ls:Loser)<-[:SCORED]-
            (:Entry)<-[:ENTERED]-
            (loser:Player)-[:REPRESENTS]->
            (q1:Country)
          OPTIONAL MATCH
            (winner)-
              [f:REPRESENTED WHERE
                (f.start_date <= e.start_date AND f.end_date > e.start_date) OR
                ('ATP' IN labels(winner) AND
                  f.start_date <= coalesce(e.atp_start_date, e.men_start_date) AND
                  f.end_date > coalesce(e.atp_start_date, e.men_start_date)) OR
                ('WTA' IN labels(winner) AND
                  f.start_date <= coalesce(e.wta_start_date, e.women_start_date) AND
                  f.end_date > coalesce(e.wta_start_date, e.women_start_date))]->
            (z:Country)
          OPTIONAL MATCH
            (loser)-
              [f1:REPRESENTED WHERE
                (f1.start_date <= e.start_date AND f1.end_date > e.start_date) OR
                ('ATP' IN labels(loser) AND
                  f1.start_date <= coalesce(e.atp_start_date, e.men_start_date) AND
                  f1.end_date > coalesce(e.atp_start_date, e.men_start_date)) OR
                ('WTA' IN labels(loser) AND
                  f1.start_date <= coalesce(e.wta_start_date, e.women_start_date) AND
                  f1.end_date > coalesce(e.wta_start_date, e.women_start_date))]->
            (z1:Country)
          WITH
            *,
            CASE
              WHEN f IS NULL THEN properties(q)
              ELSE properties(z)
            END AS winner_country,
            CASE
              WHEN f1 IS NULL THEN properties(q1)
              ELSE properties(z1)
            END AS loser_country
          WITH
            COLLECT(
              DISTINCT
              apoc.map.merge(
                apoc.map.submap(winner, ['id', 'first_name', 'last_name']),
                {country: winner_country}
              )) AS winner,
            COLLECT(
              DISTINCT
              apoc.map.merge(
                apoc.map.submap(loser, ['id', 'first_name', 'last_name']),
                {country: loser_country}
              )) AS loser,
            CASE
              WHEN m:Singles THEN 'Singles'
              ELSE 'Doubles'
            END AS matchType,
            CASE
              WHEN m:ATP THEN 'ATP'
              WHEN m:WTA THEN 'WTA'
              WHEN m:Men THEN 'ITF (M)'
              ELSE 'ITF (W)'
            END AS tour,
            [
              [ws.s1, ws.t1],
              [ws.s2, ws.t2],
              [ws.s3, ws.t3],
              [ws.s4, ws.t4],
              [ws.s5, ws.t5]
            ] AS winner_sets,
            [
              [ls.s1, ls.t1],
              [ls.s2, ls.t2],
              [ls.s3, ls.t3],
              [ls.s4, ls.t4],
              [ls.s5, ls.t5]
            ] AS loser_sets,
            ls.incomplete AS incomplete,
            CASE
              WHEN ws.serve1 IS NULL THEN false
              ELSE true
            END AS stats,
            m,
            ws
          ORDER BY tour, matchType DESC
          RETURN
            CASE
              WHEN
                ws IS NOT NULL
                THEN
                  {
                    type: matchType,
                    tour: tour,
                    winner: winner,
                    loser: loser,
                    sets: [
                      [x IN winner_sets WHERE x[0] IS NOT NULL],
                      [x IN loser_sets WHERE x[0] IS NOT NULL]
                    ],
                    incomplete: incomplete,
                    stats: stats
                  }
              WHEN
                m IS NOT NULL
                THEN {tour: tour, type: matchType, winner: 'No final played'}
              ELSE null
            END AS final }
      }
      RETURN apoc.map.merge(final, {year: y.id, id: e.id}) AS final
      ORDER BY y.id DESC
    `,
    { id: Number(id) }
  )

  const results = records.map(record => {
    const final = record.get("final")
    final["id"] = final["id"].toInt()
    final["year"] = final["year"].toInt()

    if (final["sets"]) {
      for (let i = 0; i < 2; i++) {
        for (let index = 0; index < final.sets[i].length; index++) {
          final.sets[i][index] = final.sets[i][index].map((item: any) => (item ? item.toInt() : null))
        }
      }
    }

    return final
  })

  return results
})
