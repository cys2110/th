export default defineEventHandler(async event => {
  interface QueryProps {
    edId: string
    tour: string
    type: string
    draw: string
  }
  const { edId, tour, type, draw } = getQuery<QueryProps>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (m:Match:$($type):$($draw))-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
      OPTIONAL MATCH (u:Umpire)-[:UMPIRED]->(m)
      OPTIONAL MATCH
        (c1:Country)<-[:REPRESENTS]-
        (p1:Player)-[:ENTERED]-
        (f1:Entry)-[:SCORED]-
        (s1:T1)-[:SCORED]->
        (m)
      OPTIONAL MATCH
        (p1)-
          [g1:REPRESENTED WHERE
            g1.start_date <= coalesce(e.start_date, ed.start_date) AND g1.end_date > coalesce(e.start_date, ed.start_date)]->
        (c3:Country)
      OPTIONAL MATCH
        (m)<-[:SCORED]-
        (s2:T2)<-[:SCORED]-
        (f2:Entry)<-[:ENTERED]-
        (p2:Player)-[:REPRESENTS]->
        (c2:Country)
      OPTIONAL MATCH
        (p2)-
          [g2:REPRESENTED WHERE
            g2.start_date <= coalesce(e.start_date, ed.start_date) AND g2.end_date > coalesce(e.start_date, ed.start_date)]->
        (c4:Country)
      WITH *
      ORDER BY r.number DESC, m.match_no
      WITH
        r.round AS round,
        properties(m) AS match,
        apoc.map.submap(
          s1,
          ['id', 's1', 's2', 's3', 's4', 's5', 't1', 't2', 't3', 't4', 't5', 'incomplete'],
          null,
          false
        ) AS s1,
        apoc.map.submap(
          s2,
          ['id', 's1', 's2', 's3', 's4', 's5', 't1', 't2', 't3', 't4', 't5', 'incomplete'],
          null,
          false
        ) AS s2,
        properties(f1) AS f1,
        properties(f2) AS f2,
        CASE WHEN COUNT(p1) = 0 THEN [] ELSE COLLECT(DISTINCT apoc.map.merge(
          apoc.map.submap(p1, ['id', 'first_name', 'last_name']),
          {country: coalesce(properties(c3), properties(c1))}
        )) END AS p1,
        CASE WHEN COUNT(p2) = 0 THEN [] ELSE COLLECT(DISTINCT apoc.map.merge(
          apoc.map.submap(p2, ['id', 'first_name', 'last_name']),
          {country: coalesce(properties(c4), properties(c2))}
        )) END AS p2,
        CASE
          WHEN 'Winner' IN labels(s1) THEN 't1'
          WHEN 'Winner' IN labels(s2) THEN 't2'
          ELSE null
        END AS winner,
        properties(u) AS umpire
      WITH
        round,
        match,
        s1,
        s2,
        apoc.map.clean(apoc.map.merge(f1, { team: p1 }), [], [[]]) AS t1,
        apoc.map.clean(apoc.map.merge(f2, { team: p2 }), [], [[]]) AS t2,
        winner,
        umpire
      RETURN apoc.map.clean(apoc.map.merge(
        match,
        {
          round: round,
          team1: s1,
          team2: s2,
          t1: t1,
          t2: t2,
          umpire: umpire,
          winning_team: winner
        }
      ), [], [{}, null]) AS match
    `,
    { id: `${edId}-${tour}`, type, draw }
  )

  const matches = records.map(record => {
    const match = record.get("match")

    return drawMatchSchema.parse(match)
  })

  return matches
})
