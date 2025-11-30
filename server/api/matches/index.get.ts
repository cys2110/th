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
        WITH COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), {country: coalesce(properties(c1), properties(c)), rank: p1.rank})) AS team,
        f1
        RETURN apoc.map.merge(properties(f1), {team: team}) AS team1
      }
      CALL (f2, e, ed) {
        MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[p2:ENTERED]->(f2)
        OPTIONAL MATCH
          (p)-
            [x:REPRESENTED WHERE
              x.start_date <= coalesce(e.start_date, ed.start_date) AND x.end_date > coalesce(e.start_date, ed.start_date)]->
          (c1:Country)
        WITH COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), {country: coalesce(properties(c1), properties(c)), rank: p2.rank})) AS team,
        f2
        RETURN apoc.map.merge(properties(f2), {team: team}) AS team2
      }
      WITH
        coalesce(properties(surface1), properties(surface2)) AS surface,
        coalesce(e.start_date, ed.start_date) AS start_date,
        coalesce(e.end_date, ed.end_date) AS end_date,
        m,
        t,
        team1,
        team2,
        properties(u) AS umpire,
        r.round AS round,
        properties(s1) AS t1,
        properties(s2) AS t2,
        CASE
          WHEN s1:Winner THEN 't1'
          ELSE 't2'
        END AS winning_team,
        CASE WHEN m:BestOf3 then 3 ELSE 5 END AS noOfSets
      RETURN DISTINCT
        apoc.map.merge(
          properties(m),
          {
            noOfSets: noOfSets,
            tournament: t.name,
            umpire: umpire,
            round: round,
            t1: team1,
            t2: team2,
            team1: t1,
            team2: t2,
            winning_team: winning_team,
            surface: surface,
            start_date: start_date,
            end_date: end_date
          }
        ) AS match
    `,
    params
  )

  const match = records[0].get("match")

  return matchStatsSchema.parse(match)
})
