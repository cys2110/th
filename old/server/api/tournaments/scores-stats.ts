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
      MATCH (f)-[:SCORED]->(s:Score)-[:SCORED]->(:Match)<-[:SCORED]-(s1:Score)
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
        CASE
          WHEN f:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        p,
        CASE
          WHEN z IS NULL THEN properties(c)
          ELSE properties(c1)
        END AS country,
        y.id AS year,
        e.id AS eid,
        SUM(
          coalesce(s.s1, 0) +
          coalesce(s.s2, 0) +
          coalesce(s.s3, 0) +
          coalesce(s.s4, 0) +
          coalesce(s.s5, 0)) AS games_won,
        SUM(
          coalesce(s1.s1, 0) +
          coalesce(s1.s2, 0) +
          coalesce(s1.s3, 0) +
          coalesce(s1.s4, 0) +
          coalesce(s1.s5, 0)) AS games_lost,
        SUM(
          CASE
            WHEN s.s1 > s1.s1 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s2 > s1.s2 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s3 > s1.s3 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s4 > s1.s4 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s5 > s1.s5 THEN 1
            ELSE 0
          END) AS sets_won,
        SUM(
          CASE
            WHEN s.s1 < s1.s1 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s2 < s1.s2 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s3 < s1.s3 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s4 < s1.s4 THEN 1
            ELSE 0
          END +
          CASE
            WHEN s.s5 < s1.s5 THEN 1
            ELSE 0
          END) AS sets_lost

      WITH
        year,
        COLLECT(
          DISTINCT
          apoc.map.merge(
            apoc.map.submap(p, ['id', 'first_name', 'last_name']),
            {country: country}
          )) AS players,
        [x IN labels(p) WHERE NOT x IN ['Update', 'Coach', 'Player']][0] AS tour,
        eid,
        games_won,
        games_lost,
        sets_won,
        sets_lost,
        type
      ORDER BY sets_lost
      RETURN {
        type: type,
        tour: tour,
        year: year,
        id: eid,
        team: players,
        sets_won: sets_won,
        sets_lost: sets_lost,
        games_won: games_won,
        games_lost: games_lost
      } AS scores_stats
    `,
    { id: Number(id) }
  )

  const results = records.map(record => record.get("scores_stats"))

  for (const result of results) {
    const numberKeys = ["id", "year", "sets_won", "sets_lost", "games_won", "games_lost"]

    for (const key of numberKeys) {
      if (result[key]) result[key] = result[key].toInt()
    }
  }

  return results
})
