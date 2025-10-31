export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    OPTIONAL MATCH (p:Player)-[t:REPRESENTS|REPRESENTED]->(c:Country {id: $id})
    OPTIONAL MATCH (p)-[:REPRESENTS]->(c1:Country)
    WITH
      p,
      c,
      c1,
      t,
      [x IN labels(p) WHERE NOT x IN ['Update', 'Player', 'Coach']][0] AS tour
    RETURN
      CASE
        WHEN
          p IS NOT NULL
          THEN
            apoc.map.mergeList([
              apoc.map.submap(p, ['id', 'first_name', 'last_name']),
              {country: properties(c1), tour: tour},
              properties(t)
            ])
        ELSE null
      END AS player
    ORDER BY p.last_name, p.first_name
    `,
    { id }
  )

  const results = records.map(record => record.get("player")).filter(Boolean)

  const dateKeys = ["start_date", "end_date"]

  const players = results.map((player: any) => {
    for (const key of dateKeys) {
      if (player[key]) {
        player[key] = {
          year: player[key].year.toInt(),
          month: player[key].month.toInt(),
          day: player[key].day.toInt()
        }
      }
    }

    return player
  })

  return players
})
