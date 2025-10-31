export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (:Tournament {id: $id})<-[:EDITION_OF]-
        (e:Event)<-[:ROUND_OF]-
        (r:Round {round: 'Final'})<-[:PLAYED]-
        (:Match)<-[:SCORED]-
        (:Winner)<-[:SCORED]-
        (f:Entry)<-[:ENTERED]-
        (p:Player)-[:REPRESENTS]->
        (c:Country)
      MATCH (e)-[:IN_YEAR]->(y:Year)
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
        apoc.map.submap(p, ['id', 'first_name', 'last_name']) AS player,
        y,
        e,
        CASE
          WHEN z IS NULL THEN properties(c)
          ELSE properties(c1)
        END AS country,
        CASE
          WHEN f:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        CASE
          WHEN p.dob IS NULL THEN null
          WHEN e.end_date IS NOT NULL THEN duration.between(p.dob, e.end_date)
          WHEN
            p:ATP
            THEN duration.between(p.dob, coalesce(e.atp_start_date, e.men_start_date))
          ELSE duration.between(p.dob, coalesce(e.wta_start_date, e.women_start_date))
        END AS age,
        [x IN labels(p) WHERE NOT x IN ['Update', 'Player', 'Coach']][0] AS tour
      ORDER BY age

      RETURN {
        id: e.id,
        year: y.id,
        type: type,
        age: age,
        player: apoc.map.merge(player, {tour: tour, country: country})
      } AS winner
    `,
    { id: Number(id) }
  )

  const results = records.map(record => record.get("winner"))

  for (const result of results) {
    result.id = result.id.toInt()
    result.year = result.year.toInt()
    result.age = {
      months: result.age.months.toInt(),
      days: result.age.days.toInt()
    }
  }

  return results
})
