import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => activityQuerySchema.parse(body))

    let countQuery = `/* cypher */
      MATCH (:Player {id: $id})-[:ENTERED]->(:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(m:BestOf3|BestOf5)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament)
      MATCH (ed)-[:IN_YEAR]->(y:Year)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)

      WITH
        s,
        m,
        e,
        ed,
        t,
        r,
        y,
        coalesce(e.category, ed.category) AS category,
        coalesce(eds, es) AS surface
    `

    if (params.tournaments.length || params.levels.length || params.categories.length || params.surfaces.length || params.years.length) {
      let whereClauses: string[] = []

      if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")
      if (params.levels.length) whereClauses.push("ANY(x IN $levels WHERE x IN labels(e))")
      if (params.categories.length) whereClauses.push("category IN $categories")
      if (params.surfaces.length) whereClauses.push("surface.surface IN $surfaces")
      if (params.years.length) whereClauses.push("y.id IN $years")
      if (params.levels.length) whereClauses.push("ANY(x IN $levels WHERE x IN labels(e))")

      countQuery += `
        WHERE ${whereClauses.join(" AND ")}
      `
    }

    countQuery += `/* cypher */
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
    `

    const { records: countRecords } = await useDriver().executeQuery(countQuery, params)

    let query = `/* cypher */
      CYPHER 25
      MATCH (p:Player {id: $id})-[pt:ENTERED]->(f:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(m:Match)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament)
      MATCH (ed)-[:IN_YEAR]->(y:Year)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)
      OPTIONAL MATCH (ed)-[:TOOK_PLACE_IN]->(edv:Venue)
      OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(ev:Venue)

      WITH
        p,
        m,
        f,
        s,
        r.round AS round,
        e,
        ed,
        t,
        y.id AS year,
        pt,
        coalesce(e.category, ed.category) AS category,
        coalesce(e.start_date, ed.start_date) as start_date,
        coalesce(eds, es) AS surface,
        coalesce(edv, ev) AS venue,
        [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0] AS level,
        CASE WHEN m:Singles THEN 'Singles' ELSE 'Doubles' END AS type
      WHERE
        $matchType = type
    `
    if (params.tournaments.length) query += " AND t.id IN $tournaments"
    if (params.levels.length) query += " AND level IN $levels"
    if (params.categories.length) query += " AND category IN $categories"
    if (params.surfaces.length) query += " AND surface.surface IN $surfaces"
    if (params.years.length) query += " AND y.id IN $years"

    query += `/* cypher */
      ORDER BY start_date

      MATCH (venue)-[l:LOCATED_IN]->(country:Country)

      // Get doubles partner
      CALL (start_date, f) {
        WHEN f:Doubles THEN {
          MATCH (pc:Country)<-[:REPRESENTS]-(pp:Player WHERE pp.id <> $id)-[:ENTERED]->(f)
          OPTIONAL MATCH (pp)-[z:REPRESENTED WHERE z.start_date <= start_date AND z.end_date >= start_date]->(pc2:Country)

          RETURN apoc.map.merge(
            apoc.map.submap(pp, ['id', 'first_name', 'last_name'], null, false),
            { country: coalesce(properties(pc2), properties(pc)) }
          ) AS partner
        }
        ELSE RETURN NULL AS partner
      }

      CALL (m, s, start_date) {
        WHEN m.incomplete = 'B' THEN RETURN NULL AS opponent, [] AS opponent_sets, NULL AS opponent_incomplete
        ELSE {
          MATCH (s)-[:SCORED]->(m)<-[:SCORED]-(os:Score)<-[:SCORED]-(of:Entry)<-[ot:ENTERED]-(op:Player)-[:REPRESENTS]->(oc:Country)
          OPTIONAL MATCH (op)-[z:REPRESENTED WHERE z.start_date <= start_date AND z.end_date >= start_date]->(oc2:Country)

          WITH of, os, COLLECT(DISTINCT apoc.map.clean(
            apoc.map.merge(
              apoc.map.submap(op, ['id','first_name','last_name'], null, false),
              { country: coalesce(properties(oc2), properties(oc)), rank: ot.rank }
            ), [], [null]
          )) AS opposing_players

          WITH
            of,
            opposing_players,
            collect(os) AS scores

          WITH
            of,
            opposing_players,
            head(scores) AS os

          RETURN
            apoc.map.merge(properties(of), { team: opposing_players }) AS opponent,
            [[os.s1, os.t1],[os.s2, os.t2],[os.s3, os.t3],[os.s4, os.t4],[os.s5, os.t5]] AS opponent_sets,
            os.incomplete AS opponent_incomplete
        }
      }

      WITH
        e,
        ed,
        properties(t) AS tournament,
        year,
        start_date,
        category,
        properties(surface) AS surface,
        level,
        type,
        apoc.map.clean(
          apoc.map.merge(
            properties(f),
            { rank: pt.rank }
          ), [], [null]
        ) AS player,
        COLLECT(DISTINCT apoc.map.merge(properties(venue), { country: properties(country)})) AS venues,
        partner,
        apoc.map.clean(
          apoc.map.merge(
            properties(m),
            {
              round: round,
              incomplete: coalesce(m.incomplete, opponent_incomplete, s.incomplete),
              stats: CASE WHEN s.aces IS NULL THEN false ELSE true END,
              sets: [
                [x IN [[s.s1, s.t1], [s.s2, s.t2], [s.s3, s.t3], [s.s4, s.t4], [s.s5, s.t5]] WHERE x[0] IS NOT NULL],
                [x IN opponent_sets WHERE x[0] IS NOT NULL]
              ],
              winning_team: CASE WHEN s:Winner THEN 't1' WHEN s:Loser THEN 't2' ELSE NULL END,
              opponent: opponent,
              draw: CASE WHEN m:Main THEN 'Main' ELSE 'Qualifying' END
            }
          ), [], [null]
        ) AS match

      RETURN DISTINCT apoc.map.clean({
        level: level,
        tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0],
        type: type,
        surface: surface,
        id: ed.id,
        sponsor_name: coalesce(e.sponsor_name, ed.sponsor_name),
        tournament: tournament,
        category: category,
        start_date: start_date,
        end_date: coalesce(e.end_date, ed.end_date),
        venues: venues,
        partner: partner,
        currency: coalesce(e.currency, ed.currency),
        match: match,
        player: player,
        year: year
      }, [], [null]) AS event
    `

    const { records } = await useDriver().executeQuery(query, params)

    const countResults = countRecords[0]?.toObject()
    const results = records.map(r => {
      const event = r.get("event")

      return activitySchema.parse(event)
    })

    return {
      stats: activityStatsSchema.parse(countResults),
      events: results
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
      })
    }

    console.error(error)
    throw error
  }
})
