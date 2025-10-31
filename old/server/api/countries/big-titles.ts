export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    WITH ['Grand Slam', 'ATP Masters 1000', 'ATP Masters Series', 'ATP Super 9', 'ATP Championship Series, Single Week', 'Premier Mandatory', 'WTA 1000', 'Olympics', 'ATP Finals', 'WTA Finals'] AS categories
    MATCH (c:Country {id: $id})
    OPTIONAL MATCH (c)<-[z:REPRESENTS | REPRESENTED]-(p:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(r:Round {round: 'Final'})-[:ROUND_OF]->(e:Event)-[:IN_YEAR]->(y:Year)
    WHERE (e.category in categories OR (p:ATP AND e.atp_category IN categories) OR (p:WTA AND e.wta_category IN categories)) AND
    ((type(z) = 'REPRESENTED' AND (z.start_date <= e.start_date OR (p:ATP AND z.start_date <= e.atp_start_date AND z.end_date >= e.atp_end_date) OR (p:WTA AND z.start_date <= e.wta_start_date AND z.end_date >= e.wta_end_date))) OR type(z) = 'REPRESENTS')
    OPTIONAL MATCH (e)-[:EDITION_OF]->(t:Tournament)
    OPTIONAL MATCH (p)-[:REPRESENTS]->(c1:Country)
    WITH p, properties(c1) AS country, [x IN labels(p) WHERE NOT x IN ['Update', 'Player', 'Coach']][0] AS tour, e, t, y, [x IN labels(r) WHERE x IN ['Singles', 'Doubles']][0] AS type
    RETURN apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name']), {country: country, tour: tour}) AS player, apoc.map.merge(apoc.map.submap(e, ['id', 'category', 'atp_category', 'wta_category'], null, false), {tournament: properties(t), year: y.id, type: type}) AS event
    `,
    { id }
  )

  const results = records.map(record => {
    const player = record.get("player")
    const event = record.get("event")

    const numberKeys = ["id", "year"]

    for (const key of numberKeys) {
      if (event[key]) event[key] = event[key].toInt()
    }

    return {
      player,
      event: {
        ...event,
        tournament: {
          ...event.tournament,
          id: event.tournament.id.toInt()
        }
      }
    }
  })

  return results
})
