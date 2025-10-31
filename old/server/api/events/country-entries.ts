export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (e:Event {id: toInteger($id)})
      MATCH (p:Player)-[:ENTERED]->(f:Entry)
      WHERE f.id STARTS WITH $id
      CALL (p, e) {
        MATCH (p)-[:REPRESENTS]->(c:Country)
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
          (n:Country)
        RETURN
          CASE
            WHEN z IS NULL THEN properties(c)
            ELSE properties(n)
          END AS country
      }
      WITH
        p,
        country,
        max(
          CASE
            WHEN f:Singles THEN f.rank
          END) AS singles_rank,
        max(
          CASE
            WHEN f:Doubles THEN f.rank
          END) AS doubles_rank
      RETURN
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name']),
          {
            singles_rank: singles_rank,
            doubles_rank: doubles_rank,
            country: country,
            tour: [x IN labels(p) WHERE NOT x IN ['Update', 'Coach', 'Player']][0]
          }
        ) AS entry
      ORDER BY country.id, singles_rank, doubles_rank
    `,
    { id }
  )

  const entries = records.map(record => {
    const entry = record.get("entry")
    const numberKeys = ["singles_rank", "doubles_rank"]

    for (const key of numberKeys) {
      if (entry[key]) entry[key] = entry[key].toInt()
    }

    return entry
  })

  return entries
})
