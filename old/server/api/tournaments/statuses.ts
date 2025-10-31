export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH
      (c:Country)<-[:REPRESENTS]-
      (p:Player)-[:ENTERED]->
      (f:Entry WHERE f.status IN ['Q', 'LL', 'AL', 'WC'])-[:SCORED]->
      (:Winner)-[:SCORED]->
      (m:Match)-[:PLAYED]->
      (:Round {round: 'Final'})-[:ROUND_OF]->
      (e:Event)-[:EDITION_OF]->
      (:Tournament {id: $id})
    MATCH (e)-[:IN_YEAR]->(y:Year)
    OPTIONAL MATCH (p)-[t:REPRESENTED]->(c1:Country)
    ORDER BY y.id
    WITH
      p,
      f.status AS status,
      y.id AS year,
      e.id AS eid,
      CASE
        WHEN m:Singles THEN 'Singles'
        ELSE 'Doubles'
      END AS type,
      CASE
        WHEN
          t IS NOT NULL AND
          (t.start_date <= e.start_date OR
            (p:ATP AND t.start_date <= coalesce(e.atp_start_date, e.men_start_date)) OR
            (p:WTA AND
              t.start_date <= coalesce(e.wta_start_date, e.women_start_date))) AND
          (t.end_date > e.start_date OR
            (p:ATP AND t.end_date > coalesce(e.atp_start_date, e.men_start_date)) OR
            (p:WTA AND t.end_date > coalesce(e.wta_start_date, e.women_start_date)))
          THEN properties(c1)
        ELSE properties(c)
      END AS country
    RETURN
      {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        country: country,
        tour:
          CASE
            WHEN p:ATP THEN 'ATP'
            ELSE 'WTA'
          END,
        status: status,
        year: year,
        type: type,
        eid: eid
      } AS player
    `,
    { id: Number(id) }
  )

  const results = records.map(record => record.get("player"))

  const usedIds = new Set<string>()
  const teams = []

  for (const result of results) {
    if (usedIds.has(result.id)) {
      continue
    } else if (result.type === "Singles") {
      teams.push({
        status: result.status,
        year: result.year.toInt(),
        eid: result.eid.toInt(),
        type: result.type,
        tour: result.tour,
        players: [
          {
            id: result.id,
            first_name: result.first_name,
            last_name: result.last_name,
            country: result.country
          }
        ]
      })
    } else {
      const team_mate = results.find(player => player.id !== result.id && player.year === result.year)
      if (team_mate) {
        usedIds.add(team_mate.id)
        usedIds.add(result.id)
        teams.push({
          status: result.status,
          year: result.year.toInt(),
          eid: result.eid.toInt(),
          type: result.type,
          tour: result.tour,
          players: [
            {
              id: result.id,
              first_name: result.first_name,
              last_name: result.last_name,
              country: result.country
            },
            {
              id: team_mate.id,
              first_name: team_mate.first_name,
              last_name: team_mate.last_name,
              country: team_mate.country
            }
          ]
        })
      }
    }
  }

  return teams
})
