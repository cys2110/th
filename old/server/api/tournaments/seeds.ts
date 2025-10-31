export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    WITH
      ['Final', 'Semifinals', 'Quarterfinals'] AS rounds,
      range(0, 2) AS index,
      [2, 4, 8] AS seeds
    MATCH (t:Tournament {id: $id})<-[:EDITION_OF]-(e:Event)-[:IN_YEAR]->(y:Year)
    UNWIND index AS indice
    OPTIONAL MATCH
      b =
        (c:Country)<-[:REPRESENTS]-
        (p:Player)-[:ENTERED]->
        (f:Entry)-[:SCORED]->
        (:Score)-[:SCORED]->
        (m:Match)-[:PLAYED]->
        (r:Round {round: rounds[indice]})-[:ROUND_OF]->
        (e)
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
      COLLECT(f.seed) AS entries,
      seeds,
      indice,
      e.id AS id,
      r,
      y.id AS year,
      COLLECT(
        DISTINCT
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name']),
          {
            seed: f.seed,
            country:
              CASE
                WHEN z IS NOT NULL THEN properties(c1)
                ELSE properties(c)
              END
          }
        )) AS players,
      CASE
        WHEN f:Singles THEN 'Singles'
        ELSE 'Doubles'
      END AS type,
      [x IN labels(m) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
    WHERE apoc.coll.isEqualCollection(entries, range(1, seeds[indice]))
    ORDER BY r.number, year
    RETURN {
      id: id,
      year: year,
      round: r.round,
      players: players,
      type: type,
      tour: tour
    } AS round
      UNION
    MATCH (t:Tournament {id: $id})<-[:EDITION_OF]-(e:Event)-[:IN_YEAR]->(y:Year)
    OPTIONAL MATCH
      a =
        (c:Country)<-[:REPRESENTS]-
        (p:Player)-[:ENTERED]->
        (f:Entry {seed: 1})-[:SCORED]->
        (:Winner)-[:SCORED]->
        (m:Match)-[:PLAYED]->
        (:Round {round: 'Final'})-[:ROUND_OF]->
        (e)
    WHERE p IS NOT NULL
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
      e.id AS id,
      y.id AS year,
      COLLECT(
        DISTINCT
        CASE
          WHEN p IS NULL THEN null
          ELSE
            apoc.map.merge(
              apoc.map.submap(p, ['id', 'first_name', 'last_name']),
              {
                seed: f.seed,
                country:
                  CASE
                    WHEN z IS NOT NULL THEN properties(c1)
                    ELSE properties(c)
                  END
              }
            )
        END) AS players,
      CASE
        WHEN f:Singles THEN 'Singles'
        ELSE 'Doubles'
      END AS type,
      [x IN labels(m) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
    WHERE SIZE(players) > 0
    ORDER BY year
    RETURN {
      id: id,
      year: year,
      round: 'Win',
      players: players,
      type: type,
      tour: tour
    } AS round
    `,
    { id: Number(id) }
  )

  const results = records.map(record => record.get("round"))

  for (const round of results) {
    round.id = round.id.toInt()
    round.year = round.year.toInt()

    const usedIds = new Set<string>()

    for (const player of round.players) {
      if (round.type === "Singles") {
        if (!round.teams) round.teams = []
        round.teams.push({
          seed: player.seed.toInt(),
          players: [player]
        })
      } else {
        if (!round.teams) {
          round.teams = []
        }
        if (usedIds.has(player.id)) {
          continue
        } else {
          const team_mate = round.players.find((p: any) => p.id !== player.id && p.seed.toInt() === player.seed.toInt())
          if (team_mate) {
            round.teams.push({
              seed: player.seed.toInt(),
              players: [player, team_mate]
            })
            usedIds.add(player.id)
            usedIds.add(team_mate.id)
          }
        }
      }
    }

    delete round.players
  }

  return results
})
