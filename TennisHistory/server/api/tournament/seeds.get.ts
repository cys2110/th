export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        a =
          (f1:Entry {seed: 1})-[:SCORED]->
          (:Winner)-[:SCORED]->
          (m:Match)
      MATCH b = (m)-[:PLAYED]->(r:Round {round: 'Final'})
      WHERE m.id STARTS WITH $id

      WITH
        r,
        f1

      MATCH (r)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:IN_YEAR]->(y:Year)
      CALL (f1, e, ed) {
        MATCH (f1)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(c:Country)
        OPTIONAL MATCH
          (p)-
            [z:REPRESENTED WHERE
              z.start_date <= coalesce(e.start_date, ed.start_date) AND
              z.end_date > coalesce(e.start_date, ed.start_date)]->
          (c1:Country)

        WITH
          COLLECT(
            DISTINCT
            apoc.map.merge(
              apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
              {country: coalesce(properties(c1), properties(c))}
            )) AS players

        RETURN {seed: f1.seed, team: players} AS players
      }

      WITH r, ed, y, players, CASE WHEN f1:Singles THEN 'Singles' ELSE 'Doubles' END AS type, [x IN labels(r) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour

      RETURN {id: ed.id, year: y.id, round: 'Win', tour: tour, type: type, players: [players]} AS result

      UNION ALL

      WITH [
        {round: 'Final', seeds: [1, 2]},
        {round: 'Semifinals', seeds: [1, 2, 3, 4]},
        {round: 'Quarterfinals', seeds: [1, 2, 3, 4, 5, 6, 7, 8]}
      ] AS rounds
      UNWIND rounds AS round
      MATCH
        a =
          (f1:Entry)-[:SCORED]->
          (:T1)-[:SCORED]->
          (m:Match)<-[:SCORED]-
          (:T2)<-[:SCORED]-
          (f2:Entry)
      MATCH b = (m)-[:PLAYED]->(r:Round {round: round.round})
      WHERE m.id STARTS WITH $id

      WITH
        round,
        r,
        f1,
        f2,
        apoc.coll.flatten([COLLECT(DISTINCT f1.seed), collect(DISTINCT f2.seed)]) AS seeds
      WHERE ALL(s IN seeds WHERE s IN round.seeds) AND SIZE(round.seeds) = SIZE(seeds)

      MATCH (r)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:IN_YEAR]->(y:Year)
      CALL (f1, e, ed) {
        MATCH (f1)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(c:Country)
        OPTIONAL MATCH
          (p)-
            [z:REPRESENTED WHERE
              z.start_date <= coalesce(e.start_date, ed.start_date) AND
              z.end_date > coalesce(e.start_date, ed.start_date)]->
          (c1:Country)

        WITH
          COLLECT(
            DISTINCT
            apoc.map.merge(
              apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
              {country: coalesce(properties(c1), properties(c))}
            )) AS players

        RETURN {seed: f1.seed, team: players} AS seed1
      }

      CALL (f2, e, ed) {
        MATCH (f2)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(c:Country)
        OPTIONAL MATCH
          (p)-
            [z:REPRESENTED WHERE
              z.start_date <= coalesce(e.start_date, ed.start_date) AND
              z.end_date > coalesce(e.start_date, ed.start_date)]->
          (c1:Country)

        WITH
          COLLECT(
            DISTINCT
            apoc.map.merge(
              apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
              {country: coalesce(properties(c1), properties(c))}
            )) AS players

        RETURN {seed: f2.seed, team: players} AS seed2
      }

      WITH r, ed, y, apoc.coll.flatten([seed1, seed2]) AS players, CASE WHEN f1:Singles THEN 'Singles' ELSE 'Doubles' END AS type, [x IN labels(r) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour

      RETURN {id: ed.id, year: y.id, round: r.round, tour: tour, type: type, players: players} AS result
    `,
    { id }
  )

  if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tournament with ID ${id} could not be found.`
    })
  }

  const results = records.map(record => {
    const result = record.get("result")
    return tournamentSeedSchema.parse(result)
  })

  return results
})
