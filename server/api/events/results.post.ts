export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => querySchema.parse(body))

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (m:Match)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
    WHERE
      ($date IS NULL OR m.date = $date)
      AND ($round IS NULL OR r.round = $round)
      AND ($matchType IS NULL OR $matchType in labels(m))
      AND ($drawType IS NULL OR $drawType in labels(m))
    MATCH (lf:Entry)-[:SCORED]->(ls:Loser)-[:SCORED]->(m)<-[:SCORED]-(ws:Winner)<-[:SCORED]-(wf:Entry)
    OPTIONAL MATCH (u:Umpire)-[:UMPIRED]->(m)

    CALL (wf, e, ed) {
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(wf)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      WITH coalesce(properties(c1), properties(c)) AS country, apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false) AS player, t, p
      WITH apoc.map.clean(apoc.map.merge(player, { country: country, rank: t.rank }), [], [null]) AS player, p
      RETURN COLLECT(DISTINCT p.id) AS winner_ids, COLLECT(DISTINCT player) AS winners
    }

    CALL (lf, e, ed) {
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(lf)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      WITH coalesce(properties(c1), properties(c)) AS country, apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false) AS player, t, p
      WITH apoc.map.clean(apoc.map.merge(player, { country: country, rank: t.rank }), [], [null]) AS player, p
      RETURN COLLECT(DISTINCT player) AS losers, COLLECT(DISTINCT p.id) AS loser_ids
    }

    WITH
      r,
      m,
      u,
      ws,
      wf,
      lf,
      ls,
      winners,
      losers,
      winner_ids,
      loser_ids
    WHERE
      (SIZE($players) = 0 OR ANY(x IN $players WHERE x IN winner_ids OR x IN loser_ids))

    WITH
      r,
      m,
      u,
      CASE WHEN ws.serve1 IS NULL THEN false ELSE true END AS stats,
      apoc.map.merge(properties(wf), { team: winners }) AS winner,
      apoc.map.merge(properties(lf), { team: losers }) AS loser,
      CASE WHEN r:Singles THEN 'Singles' ELSE 'Doubles' END AS type,
      CASE WHEN m:Main THEN 'Main' ELSE 'Qualifying' END AS draw,
      CASE WHEN m:BestOf5 THEN 5 WHEN m:BestOf3 THEN 3 ELSE NULL END AS noOfSets,
      [[ws.s1, ws.t1], [ws.s2, ws.t2], [ws.s3, ws.t3], [ws.s4, ws.t4], [ws.s5, ws.t5]] AS winner_sets,
      [[ls.s1, ls.t1], [ls.s2, ls.t2], [ls.s3, ls.t3], [ls.s4, ls.t4], [ls.s5, ls.t5]] AS loser_sets,
      ls.incomplete AS incomplete
    ORDER BY r.number
    RETURN apoc.map.merge(properties(m), {
      draw: draw,
      type: type,
      round: r.round,
      round_no: r.number,
      umpire: properties(u),
      stats: stats,
      sets: [[x IN winner_sets WHERE x[0] IS NOT NULL], [x IN loser_sets WHERE x[0] IS NOT NULL]],
      winner: winner,
      loser: loser,
      incomplete: incomplete,
      noOfSets: noOfSets
    }) AS match
    `,
    params
  )

  const results = records.map(r => {
    const match = r.get("match")

    return matchSchema.parse(match)
  })

  return results.sort((a: any, b: any) => {
    if (a.round_no !== b.round_no) return a.round_no - b.round_no
    const minA = Math.min(...a.winner.team.map((p: any) => (p.rank ? p.rank : 1e9)).concat(...a.loser.team.map((p: any) => (p.rank ? p.rank : 1e9))))
    const minB = Math.min(...b.winner.team.map((p: any) => (p.rank ? p.rank : 1e9)).concat(...b.loser.team.map((p: any) => (p.rank ? p.rank : 1e9))))
    return minA - minB
  })
})
