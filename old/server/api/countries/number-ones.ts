export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (c:Country {id: $id})
    OPTIONAL MATCH (p:Player)-[t:REPRESENTS | REPRESENTED]->(c) WHERE
      (type(t) = 'REPRESENTS' AND (p.ch_singles = 1 OR p.ch_doubles = 1)) OR
      (type(t) = 'REPRESENTED' AND p.ch_singles = 1 AND p.singles_ch_date >= t.start_date AND p.singles_ch_date <= t.end_date) OR
      (type(t) = 'REPRESENTED' AND p.ch_doubles = 1 AND p.doubles_ch_date >= t.start_date AND p.doubles_ch_date <= t.end_date)
    MATCH (p)-[:REPRESENTS]->(sc:Country)
    WITH p, properties(sc) AS country, [x IN labels(p) WHERE NOT x IN ['Update', 'Player', 'Coach']][0] AS tour
    RETURN apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name', 'ch_singles', 'singles_ch_date', 'ch_doubles', 'doubles_ch_date']), {tour: tour, country: country}) AS player
    `,
    { id }
  )

  const players = records.map((r: any) => {
    const player = r.get("player")
    const dateKeys = ["singles_ch_date", "doubles_ch_date"]
    const numberKeys = ["ch_singles", "ch_doubles"]

    for (const key of dateKeys) {
      if (player[key]) {
        player[key] = {
          year: player[key].year.toInt(),
          month: player[key].month.toInt(),
          day: player[key].day.toInt()
        }
      }
    }

    for (const key of numberKeys) {
      if (player[key]) {
        player[key] = player[key].toInt()
      }
    }

    return player
  })

  return players
})
