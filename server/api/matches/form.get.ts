export default defineEventHandler(async event => {
  const { matchId } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p1f:Entry)-[:SCORED]->(p1s:T1)-[:SCORED]->(m:Match {id: $matchId})<-[:SCORED]-(p2s:T2)<-[:SCORED]-(p2f:Entry)
      MATCH (m)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)
      OPTIONAL MATCH (u:Umpire)-[:UMPIRED]->(m)

      CALL (p1f, m, e, ed) {
        MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(p1f)
        OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
        WITH coalesce(properties(c1), properties(c)) AS country, apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false) AS player, t
        WITH apoc.map.clean(apoc.map.merge(player, { country: country, rank: t.rank }), [], [null]) AS player
        RETURN COLLECT(DISTINCT player) AS team1_players
      }

      CALL (p2f, m, e, ed) {
        MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(p2f)
        OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
        WITH coalesce(properties(c1), properties(c)) AS country, apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false) AS player, t
        WITH apoc.map.clean(apoc.map.merge(player, { country: country, rank: t.rank }), [], [null]) AS player
        RETURN COLLECT(DISTINCT player) AS team2_players
      }

      WITH
        r,
        m,
        u,
        apoc.map.merge(properties(p1f), { team: team1_players }) AS team1,
        apoc.map.merge(properties(p2f), { team: team2_players }) AS team2,
        CASE WHEN r:Singles THEN 'Singles' ELSE 'Doubles' END AS type,
        CASE WHEN m:Main THEN 'Main' ELSE 'Qualifying' END AS draw,
        CASE WHEN m:BestOf5 THEN 5 WHEN m:BestOf3 THEN 3 ELSE NULL END AS noOfSets,
        CASE WHEN p1s:Winner THEN 1 ELSE 2 END AS winner,
        properties(p1s) AS t1,
        properties(p2s) AS t2

      RETURN apoc.map.merge(properties(m), {
        winner: winner,
        round: r.round,
        umpire: properties(u),
        type: type,
        draw: draw,
        noOfSets: noOfSets,
        team1: team1,
        team2: team2,
        t1: t1,
        t2: t2
      }) AS match
    `,
    { matchId }
  )

  const results = records[0].get("match")

  return matchFormDetailsSchema.parse(results)
})
