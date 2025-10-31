export default defineEventHandler(async query => {
  const { p1Id, p2Id } = getQuery(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH
        (:Player {id: $p1Id})-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (s1:Score)-[:SCORED]->
        (m:Singles)<-[:SCORED]-
        (s2:Score)<-[:SCORED]-
        (:Entry)<-[:ENTERED]-
        (:Player {id: $p2Id})
      OPTIONAL MATCH
        (w:Player)-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (:Winner)-[:SCORED]->
        (m)-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event)-[:EDITION_OF]->
        (t:Tournament)
      OPTIONAL MATCH (s:Surface)<-[:ON_SURFACE]-(e)-[:IN_YEAR]->(y:Year)
      WITH DISTINCT
        *,
        apoc.coll.min([
          e.start_date,
          e.atp_start_date,
          e.wta_start_date,
          e.men_start_date,
          e.women_start_date
        ]) AS start_date
      ORDER BY start_date
      CALL (w, e) {
        MATCH (w)-[:REPRESENTS]->(c:Country)
        OPTIONAL MATCH
          (w)-
            [f:REPRESENTED WHERE
              (f.start_date <= e.start_date AND f.end_date > e.start_date) OR
              ('ATP' IN labels(w) AND
                f.start_date <= coalesce(e.atp_start_date, e.men_start_date) AND
                f.end_date > coalesce(e.atp_start_date, e.men_start_date)) OR
              ('WTA' IN labels(w) AND
                f.start_date <= coalesce(e.wta_start_date, e.women_start_date) AND
                f.end_date > coalesce(e.wta_start_date, e.women_start_date))]->
          (c1:Country)
        RETURN
          CASE
            WHEN f IS NULL THEN properties(c)
            ELSE properties(c1)
          END AS country
      }
      WITH *,
            [
              [s1.s1, s1.t1],
              [s1.s2, s1.t2],
              [s1.s3, s1.t3],
              [s1.s4, s1.t4],
              [s1.s5, s1.t5]
            ] AS s1Sets,
            [
              [s2.s1, s2.t1],
              [s2.s2, s2.t2],
              [s2.s3, s2.t3],
              [s2.s4, s2.t4],
              [s2.s5, s2.t5]
            ]  AS s2Sets
      WITH
        {
          match_no: m.match_no,
          winner:
            apoc.map.merge(
              apoc.map.submap(w, ['id', 'first_name', 'last_name']),
              {country: country}
            ),
          round: r.round,
          sets: [
            [x IN s1Sets WHERE x[0] IS NOT NULL],
            [x IN s2Sets where x[0] IS NOT NULL]
          ],
          incomplete: coalesce(s1.incomplete, s2.incomplete, null),
          stats:
            CASE
              WHEN s1.aces IS NOT NULL THEN true
              ELSE false
            END
        } AS match,
        t,
        e,
        s,
        y
      RETURN {
        tournament: properties(t),
        id: e.id,
        surface: properties(s),
        year: y.id,
        match: match
      } AS event
    `,
    { p1Id, p2Id }
  )

  const matches = records.map(record => {
    const event = record.get("event")

    for (let i = 0; i < 2; i++) {
      for (let index = 0; index < event.match.sets[i].length; index++) {
        event.match.sets[i][index] = event.match.sets[i][index].map((x: any) => (x ? x.toInt() : null))
      }
    }

    return {
      ...event,
      id: event.id.toInt(),
      year: event.year.toInt(),
      tournament: {
        ...event.tournament,
        id: event.tournament.id.toInt()
      },
      match: {
        ...event.match,
        match_no: event.match.match_no.toInt()
      }
    }
  })

  return matches
})
