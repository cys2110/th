export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (m:Match)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
    MATCH (lf:Entry)-[:SCORED]->(ls:Loser)-[:SCORED]->(m)<-[:SCORED]-(ws:Winner)<-[:SCORED]-(wf:Entry)
    OPTIONAL MATCH (u:Umpire)-[:UMPIRED]->(m)
    CALL (wf, e, ed) {
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(wf)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      WITH CASE WHEN z IS NULL THEN properties(c) ELSE properties(c1) END AS country, apoc.map.submap(p, ['id', 'first_name', 'last_name']) AS player, t
      RETURN COLLECT(DISTINCT apoc.map.merge(player, {country: country, rank: t.rank})) AS winners
    }
    CALL (lf, e, ed) {
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[t:ENTERED]->(lf)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      WITH CASE WHEN z IS NULL THEN properties(c) ELSE properties(c1) END AS country, apoc.map.submap(p, ['id', 'first_name', 'last_name']) AS player, t
      RETURN COLLECT(DISTINCT apoc.map.merge(player, {country: country, rank: t.rank})) AS losers
    }
    WITH r, m, u, CASE WHEN ws.serve1 IS NULL THEN false ELSE true END AS stats, apoc.map.merge(properties(wf), {team: winners}) AS winner, apoc.map.merge(properties(lf), {team: losers}) AS loser, CASE WHEN r:Singles THEN 'Singles' ELSE 'Doubles' END AS type, CASE WHEN m:Main THEN 'Main' ELSE 'Qualifying' END AS draw, [[ws.s1, ws.t1], [ws.s2, ws.t2], [ws.s3, ws.t3], [ws.s4, ws.t4], [ws.s5, ws.t5]] AS winner_sets, [[ls.s1, ls.t1], [ls.s2, ls.t2], [ls.s3, ls.t3], [ls.s4, ls.t4], [ls.s5, ls.t5]] AS loser_sets, ls.incomplete AS incomplete
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
      incomplete: incomplete
    }) AS match
    `,
    { id: `${edId}-${tour}` }
  )

  const results = records.map(r => {
    const match = r.get("match")

    const numberKeys = ["match_no", "round_no"]
    numberKeys.forEach(key => {
      if (match[key]) match[key] = match[key].toInt()
    })

    if (match.date) match.date = match.date.toStandardDate().toISOString().slice(0, 10)

    if (match.duration) match.duration = match.duration.toString()

    const entryNumbers = ["seed", "q_seed"]
    entryNumbers.forEach(key => {
      if (match.winner[key]) match.winner[key] = match.winner[key].toInt()
      if (match.loser[key]) match.loser[key] = match.loser[key].toInt()
    })

    for (const player of match.winner.team) {
      if (player.rank) player.rank = player.rank.toInt()
    }
    for (const player of match.loser.team) {
      if (player.rank) player.rank = player.rank.toInt()
    }

    for (let i = 0; i < 2; i++) {
      for (let index = 0; index < match.sets[i].length; index++) {
        match.sets[i][index] = match.sets[i][index].map((item: any) => (item ? item.toInt() : null))
      }
    }

    return match
  })

  return results.sort((a: any, b: any) => {
    if (a.round_no !== b.round_no) return a.round_no - b.round_no
    const minA = Math.min(...a.winner.team.map((p: any) => (p.rank ? p.rank : 1e9)).concat(...a.loser.team.map((p: any) => (p.rank ? p.rank : 1e9))))
    const minB = Math.min(...b.winner.team.map((p: any) => (p.rank ? p.rank : 1e9)).concat(...b.loser.team.map((p: any) => (p.rank ? p.rank : 1e9))))
    return minA - minB
  })
})
