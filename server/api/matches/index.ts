import { int } from "neo4j-driver"

export default defineEventHandler(async query => {
  const { edId, tour, mid } = getQuery(query)

  const matchParams = destructureMid(mid as string)
  const params = {
    ...matchParams,
    id: `${edId}-${tour}`,
    match_no: int(matchParams.match_no)
  }

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (m:Match:$($draw):$($type) {match_no: $match_no})-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->
        (t:Tournament)
      MATCH (f1:Entry)-[:SCORED]->(s1:T1)-[:SCORED]->(m)<-[:SCORED]-(s2:T2)<-[:SCORED]-(f2:Entry)
      OPTIONAL MATCH (m)<-[:UMPIRED]-(u:Umpire)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(surface1:Surface)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(surface2:Surface)
      CALL (f1, e, ed) {
        MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[p1:ENTERED]->(f1)
        OPTIONAL MATCH
          (p)-
            [x:REPRESENTED WHERE
              x.start_date <= coalesce(e.start_date, ed.start_date) AND x.end_date > coalesce(e.start_date, ed.start_date)]->
          (c1:Country)
        WITH COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), {country: CASE WHEN c1 IS NULL THEN properties(c) ELSE properties(c1) END, rank: p1.rank})) AS team,
        f1
        RETURN apoc.map.merge(properties(f1), {players: team}) AS team1
      }
      CALL (f2, e, ed) {
        MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[p2:ENTERED]->(f2)
        OPTIONAL MATCH
          (p)-
            [x:REPRESENTED WHERE
              x.start_date <= coalesce(e.start_date, ed.start_date) AND x.end_date > coalesce(e.start_date, ed.start_date)]->
          (c1:Country)
        WITH COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), {country: CASE WHEN c1 IS NULL THEN properties(c) ELSE properties(c1) END, rank: p2.rank})) AS team,
        f2
        RETURN apoc.map.merge(properties(f2), {players: team}) AS team2
      }
      WITH
        CASE
          WHEN surface1 IS NOT NULL THEN properties(surface1)
          ELSE properties(surface2)
        END AS surface,
        coalesce(e.start_date, ed.start_date) AS start_date,
        coalesce(e.end_date, ed.end_date) AS end_date,
        m,
        t,
        properties(u) AS umpire,
        r.round AS round,
        apoc.map.merge(properties(s1), {team: team1}) AS t1,
        apoc.map.merge(properties(s2), {team: team2}) AS t2,
        CASE
          WHEN s1:Winner THEN true
          ELSE false
        END AS t1Winner
      RETURN DISTINCT
        apoc.map.merge(
          properties(m),
          {
            tournament: t.name,
            umpire: umpire,
            round: round,
            t1: t1,
            t2: t2,
            t1_winner: t1Winner,
            surface: surface,
            start_date: start_date,
            end_date: end_date
          }
        ) AS match
    `,
    params
  )

  const match = records[0].get("match")

  const numberKeys = [
    "aces",
    "dfs",
    "serve1_w",
    "serve1",
    "serve2_w",
    "serve2",
    "bps_saved",
    "bps_faced",
    "ret1_w",
    "ret1",
    "ret2_w",
    "ret2",
    "bps_converted",
    "bp_opps",
    "winners",
    "ues",
    "net_w",
    "net",
    "max_speed",
    "avg1_speed",
    "avg2_speed",
    "serve_games",
    "return_games",
    "s1",
    "s2",
    "s3",
    "s4",
    "s5",
    "t1",
    "t2",
    "t3",
    "t4",
    "t5"
  ]

  const teams = ["t1", "t2"]
  const entryNumberKeys = ["seed", "q_seed"]
  const dateKeys = ["start_date", "end_date", "date"]

  for (const teamKey of teams) {
    for (const key of numberKeys) {
      if (match[teamKey][key]) {
        match[teamKey][key] = match[teamKey][key].toInt()
      }
    }

    for (const entryKey of entryNumberKeys) {
      if (match[teamKey].team[entryKey]) {
        match[teamKey].team[entryKey] = match[teamKey].team[entryKey].toInt()
      }

      for (const player of match[teamKey].team.players) {
        if (player.rank) {
          player.rank = player.rank.toInt()
        }
      }
    }
  }

  for (const key of dateKeys) {
    if (match[key]) {
      match[key] = match[key].toStandardDate().toISOString().slice(0, 10)
    }
  }

  // Convert duration object to number (in minutes)
  if (match.duration) {
    match.duration = match.duration.toString()
  }

  const stats = []

  for (const stat of MATCH_STATS) {
    if (stat.key || ["Service games won", "Return games won"].includes(stat.label)) {
      const t1 = stat.key ? match.t1[stat.key] : match.t1[stat.denominators![0]]
      const t2 = stat.key ? match.t2[stat.key] : match.t2[stat.denominators![0]]
      if (t1 !== undefined && t2 !== undefined) {
        stats.push({
          label: stat.label.replace(" won", ""),
          category: stat.category,
          low: stat.low,
          percent: false,
          t1,
          t2,
          t1_pc: t1 + t2 === 0 ? 0 : percentage(t1, t1 + t2),
          t2_pc: t1 + t2 === 0 ? 0 : percentage(t2, t1 + t2)
        })
      }
    } else {
      const t1Numerator = stat.numerators!.reduce((acc, key) => acc + (match.t1[key] ?? 0), 0)
      const t1Denominator = stat.denominators!.reduce((acc, key) => acc + (match.t1[key] ?? 0), 0)
      const t2Numerator = stat.numerators!.reduce((acc, key) => acc + (match.t2[key] ?? 0), 0)
      const t2Denominator = stat.denominators!.reduce((acc, key) => acc + (match.t2[key] ?? 0), 0)

      stats.push({
        ...stat,
        t1: `${t1Numerator}/${t1Denominator}`,
        t2: `${t2Numerator}/${t2Denominator}`,
        t1_pc: t1Denominator === 0 ? 0 : percentage(t1Numerator, t1Denominator),
        t2_pc: t2Denominator === 0 ? 0 : percentage(t2Numerator, t2Denominator)
      })
    }
  }

  const { surface, court, round, date, end_date, duration, match_no, umpire, t1_winner, start_date, t1, t2, tournament } = match

  const p1Sets = []
  const p2Sets = []

  const sets = ["1", "2", "3", "4", "5"]

  for (const set of sets) {
    if (match.t1[`s${set}`] && match.t2[`s${set}`]) {
      p1Sets.push([match.t1[`s${set}`], match.t1[`t${set}`]])
      p2Sets.push([match.t2[`s${set}`], match.t2[`t${set}`]])
    }
  }

  return {
    tournament,
    surface,
    court,
    round,
    date,
    end_date,
    duration,
    match_no: match_no.toInt(),
    umpire,
    t1_winner,
    start_date,
    match_stats: stats,
    sets: [p1Sets, p2Sets],
    t1: t1.team,
    t2: t2.team,
    t1_incomplete: t1.incomplete,
    t2_incomplete: t2.incomplete
  }
})
