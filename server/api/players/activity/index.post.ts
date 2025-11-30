export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => querySchema.parse(body))

  const { records: countRecords } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (:Player {id: $id})-[:ENTERED]->(:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(m:BestOf3|BestOf5)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament WHERE SIZE($tournaments) = 0 OR t.id IN $tournaments)

      MATCH (ed)-[:IN_YEAR]->(:Year { id: $year })

      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)

      WITH
        s,
        m,
        e,
        ed,
        t,
        r,
        coalesce(e.category, ed.category) AS category,
        coalesce(e.start_date, ed.start_date) AS start_date,
        coalesce(eds, es) AS surface
      WHERE
        (SIZE($categories) = 0 OR category IN $categories)
        AND (SIZE($levels) = 0 OR ANY(x IN $levels WHERE x IN labels(e)))
        AND $matchType in labels(m)
        AND ($dateRange IS NULL OR (start_date >= $dateRange.start AND start_date <= $dateRange.end))
        AND (SIZE($surfaces) = 0 OR surface.id IN $surfaces)

      WITH
        COUNT(DISTINCT CASE WHEN s:Winner AND s:Singles THEN s END) AS singles_wins,
        COUNT(DISTINCT CASE WHEN s:Winner AND s:Doubles THEN s END) AS doubles_wins,
        COUNT(DISTINCT CASE WHEN s:Loser AND s:Singles THEN s END) AS singles_losses,
        COUNT(DISTINCT CASE WHEN s:Loser AND s:Doubles THEN s END) AS doubles_losses,
        COUNT(DISTINCT CASE WHEN s:Winner AND s:Singles AND r.round = 'Final' THEN s END) AS singles_titles,
        COUNT(DISTINCT CASE WHEN s:Winner AND s:Doubles AND r.round = 'Final' THEN s END) AS doubles_titles
      RETURN
        singles_wins,
        doubles_wins,
        singles_losses,
        doubles_losses,
        singles_titles,
        doubles_titles
    `,
    params
  )

  let query = `/* cypher */
    CYPHER 25
    MATCH (p:Player {id: $id})-[pt:ENTERED]->(f:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(m:Match)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament WHERE SIZE($tournaments) = 0 OR t.id IN $tournaments)

    MATCH (ed)-[:IN_YEAR]->(y:Year { id: $year })

    OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)

    CALL (ed, e) {
      OPTIONAL MATCH (ed)-[:TOOK_PLACE_IN]->(edv:Venue)-[:LOCATED_IN]->(edc:Country)
      OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(ev:Venue)-[:LOCATED_IN]->(ec:Country)
      WITH
        CASE
          WHEN ev IS NOT NULL THEN apoc.map.merge(properties(ev), { country: properties(ec) })
          ELSE apoc.map.merge(properties(edv), { country: properties(edc) })
        END AS venue
      RETURN COLLECT(venue) AS venues
    }

    CALL (ed, e, f) {
      WHEN f:Doubles THEN {
        MATCH (pc:Country)<-[:REPRESENTS]-(pp:Player WHERE pp.id <> $id)-[:ENTERED]->(f)
        OPTIONAL MATCH (pp)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date >= coalesce(e.start_date, ed.start_date)]->(pc2:Country)

        RETURN apoc.map.merge(
          apoc.map.submap(pp, ['id', 'first_name', 'last_name'], null, false),
          { country: coalesce(properties(pc2), properties(pc)) }
        ) AS partner
      }
      ELSE RETURN NULL AS partner
    }

    CALL (m, s, e, ed) {
      WHEN m.incomplete = 'B' THEN RETURN NULL AS opponent, [] AS opponent_sets, NULL AS opponent_incomplete
      ELSE {
        MATCH (s)-[:SCORED]->(m)<-[:SCORED]-(os:Score)<-[:SCORED]-(of:Entry)<-[ot:ENTERED]-(op:Player)-[:REPRESENTS]->(oc:Country)
        OPTIONAL MATCH (op)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date >= coalesce(e.start_date, ed.start_date)]->(oc2:Country)

        WITH of, ot, os, COLLECT(DISTINCT apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(op, ['id', 'first_name', 'last_name'], null, false),
            { country: coalesce(properties(oc2), properties(oc)), rank: ot.rank }
          ), [], [null]
        )) AS opposing_players

        RETURN
          apoc.map.merge(
            properties(of),
            { team: opposing_players }
          ) AS opponent,
          [[os.s1, os.t1], [os.s2, os.t2], [os.s3, os.t3], [os.s4, os.t4], [os.s5, os.t5]] AS opponent_sets,
          os.incomplete AS opponent_incomplete
      }
    }

    WITH
      f,
      s,
      m,
      r,
      e,
      ed,
      t,
      y,
      pt,
      coalesce(e.category, ed.category) AS category,
      coalesce(e.start_date, ed.start_date) AS start_date,
      coalesce(eds, es) AS surface,
      venues,
      partner,
      opponent,
      opponent_sets,
      opponent_incomplete,
      [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0] AS level,
      CASE WHEN m:Singles THEN 'Singles' ELSE 'Doubles' END AS type
    WHERE
      (SIZE($categories) = 0 OR category IN $categories)
      AND (SIZE($levels) = 0 OR level IN $levels)
      AND type = $matchType
      AND ($dateRange IS NULL OR (start_date >= $dateRange.start AND start_date <= $dateRange.end))
      AND (SIZE($surfaces) = 0 OR surface.id IN $surfaces)
    ORDER BY start_date

    WITH
      opponent_sets,
      coalesce(m.incomplete, opponent_incomplete, s.incomplete) AS incomplete,
      CASE WHEN s.aces IS NULL THEN false ELSE true END AS stats,
      opponent,
      [[s.s1, s.t1], [s.s2, s.t2], [s.s3, s.t3], [s.s4, s.t4], [s.s5, s.t5]]  AS player_sets,
      m,
      r,
      e,
      f,
      ed,
      t,
      s,
      pt,
      y,
      venues,
      partner,
      surface,
      start_date,
      category,
      level,
      type

    WITH
      e,
      ed,
      t,
      f,
      y,
      venues,
      partner,
      surface,
      start_date,
      category,
      level,
      pt,
      type,
      apoc.map.clean(
        apoc.map.merge(
          properties(m),
          {
            round: r.round,
            incomplete: incomplete,
            stats: stats,
            sets: [
              [x IN player_sets WHERE x[0] IS NOT NULL],
              [x IN opponent_sets WHERE x[0] IS NOT NULL]
            ],
            winning_team: CASE WHEN s:Winner THEN 't1' ELSE 't2' END,
            opponent: opponent,
            draw: CASE WHEN m:Main THEN 'Main' ELSE 'Qualifying' END
          }
        ), [], [null]
      ) AS match

    RETURN DISTINCT {
      level: level,
      tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0],
      type: type,
      surface: properties(surface),
      id: ed.id,
      sponsor_name: coalesce(e.sponsor_name, ed.sponsor_name),
      tournament: properties(t),
      category: category,
      start_date: start_date,
      end_date: coalesce(e.end_date, ed.end_date),
      venues: venues,
      partner: partner,
      currency: coalesce(e.currency, ed.currency),
      match: match,
      player: apoc.map.clean(apoc.map.merge(properties(f), { rank: pt.rank}), [], [null]),
      year: y.id
    } AS event
  `

  const { records } = await useDriver().executeQuery(query, params)

  const countResults = countRecords[0]?.toObject()
  const results = records.map(r => {
    const event = r.get("event")

    return activitySchema.parse(event)
  })

  return {
    stats: yearStatsSchema.parse(countResults),
    events: results
  }
})
