export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    WITH ['ATP', 'WTA'] AS tours, ['Singles', 'Doubles'] AS types
      UNWIND tours AS tour
      UNWIND types AS type

      MATCH
        (c:Country)<-[:REPRESENTS]-
        (p:Player: $ (tour))-[:ENTERED]->
        (f:Entry: $ (type))-[:SCORED]->
        (:Winner)-[:SCORED]->
        (:Match)-[:PLAYED]->
        (:Round {round: 'Final'})-[:ROUND_OF]->
        (e:Event)-[:EDITION_OF]->
        (:Tournament {id: $id})
      MATCH (e)-[:IN_YEAR]->(y:Year)
      WHERE f.rank IS NOT NULL

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

      WITH DISTINCT tour, type, p, f.rank AS rank, z, c, c1, y, e
      WITH
        tour,
        type,
        max(rank) AS worstRank,
        collect(
          apoc.map.merge(
            apoc.map.submap(p, ['id', 'first_name', 'last_name']),
            {
              rank: rank,
              country:
                CASE
                  WHEN z IS NULL THEN properties(c)
                  ELSE properties(c1)
                END,
              year: y.id,
              eid: e.id
            }
          )) AS rows
      WITH
        tour,
        type,
        worstRank,
        [r IN rows WHERE r.rank = worstRank | apoc.map.clean(r, ['rank'], [])] AS players
      UNWIND players AS player
      RETURN 'Win' AS round, tour, type, worstRank, player.eid AS id, player.year AS year, apoc.map.clean(player, ['eid', 'year'], []) AS player
        UNION
      WITH
        ['Final', 'Semifinals', 'Quarterfinals'] AS rounds,
        ['ATP', 'WTA'] AS tours,
        ['Singles', 'Doubles'] AS types
      UNWIND rounds AS round
      UNWIND tours AS tour
      UNWIND types AS type

      MATCH
        (c:Country)<-[:REPRESENTS]-
        (p:Player: $ (tour))-[:ENTERED]->
        (f:Entry: $ (type))-[:SCORED]->
        (:Score)-[:SCORED]->
        (:Match)-[:PLAYED]->
        (:Round {round: round})-[:ROUND_OF]->
        (e:Event)-[:EDITION_OF]->
        (:Tournament {id: $id})
      MATCH (e)-[:IN_YEAR]->(y:Year)
      WHERE f.rank IS NOT NULL

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

      WITH DISTINCT round, tour, type, p, f.rank AS rank, c, c1, z, y, e
      WITH
        round,
        tour,
        type,
        max(rank) AS worstRank,
        collect(
          apoc.map.merge(
            apoc.map.submap(p, ['id', 'first_name', 'last_name']),
            {
              rank: rank,
              country:
                CASE
                  WHEN z IS NULL THEN properties(c)
                  ELSE properties(c1)
                END,
              year: y.id,
              eid: e.id
            }
          )) AS rows
      WITH
        round,
        tour,
        type,
        worstRank,
        [r IN rows WHERE r.rank = worstRank | apoc.map.clean(r, ['rank'], [])] AS players
      UNWIND players AS player
      RETURN round, tour, type, worstRank, player.eid AS id, player.year AS year, apoc.map.clean(player, ['eid', 'year'], []) AS player
      ORDER BY
      CASE round
        WHEN 'Win' THEN 0
        WHEN 'Final' THEN 1
        WHEN 'Semifinals' THEN 2
        WHEN 'Quarterfinals' THEN 3
        ELSE 4
      END, tour, type DESC
    `,
    { id: Number(id) }
  )

  const results = records.map(record => {
    const { round, tour, type, worstRank, player, id, year } = record.toObject()

    return {
      round,
      tour,
      type,
      rank: worstRank.toInt(),
      id: id.toInt(),
      year: year.toInt(),
      player
    }
  })

  return results
})
