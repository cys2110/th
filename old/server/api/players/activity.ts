export default defineEventHandler(async event => {
  const { year, id } = getQuery<{ year: string; id: string }>(event)

  const formattedParams = {
    id,
    year: Number(year),
    challenger: CHALLENGER_CATEGORIES
  }

  const { records: statsRecords } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (p:Player {id: $id})-[:ENTERED]->
        (f:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (m:Best3|Best5)-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event)-[:IN_YEAR]->
        (y:Year {id: $year})
      WHERE
        coalesce(e.category, e.atp_category, e.wta_category) IS NULL OR
        (p:ATP AND
          e:ATP AND
          (e.category IS NOT NULL OR NOT e.atp_category IN $challenger)) OR
        (p:WTA AND
          e:WTA AND
          (e.category IS NOT NULL OR NOT e.wta_category IN $challenger))
      WITH
        COUNT(DISTINCT
          CASE
            WHEN s:Winner AND s:Singles THEN s
          END) AS singlesWins,
        COUNT(DISTINCT
          CASE
            WHEN s:Loser AND s:Singles THEN s
          END) AS singlesLosses,
        COUNT(
          CASE
            WHEN s:Winner AND s:Singles AND r.round = 'Final' THEN s
          END) AS singlesTitles,
        COUNT(
          CASE
            WHEN s:Winner AND s:Doubles THEN s
          END) AS doublesWins,
        COUNT(
          CASE
            WHEN s:Loser AND s:Doubles THEN s
          END) AS doublesLosses,
        COUNT(
          CASE
            WHEN s:Winner AND s:Doubles AND r.round = 'Final' THEN s
          END) AS doublesTitles
      RETURN [
        {category: 'Wins', value: singlesWins, type: 'Singles'},
        {category: 'Losses', value: singlesLosses, type: 'Singles'},
        {category: 'Titles', value: singlesTitles, type: 'Singles'},
        {category: 'Wins', value: doublesWins, type: 'Doubles'},
        {category: 'Losses', value: doublesLosses, type: 'Doubles'},
        {category: 'Titles', value: doublesTitles, type: 'Doubles'}
      ] AS stats
    `,
    formattedParams
  )

  const { records: activityRecords } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH
        (p:Player {id: $id})-[:ENTERED]->
        (f:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (m:Match)-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event)-[:IN_YEAR]->
        (:Year {id: $year})
      MATCH (t:Tournament)<-[:EDITION_OF]-(e)
      WITH
        *,
        [e.start_date,
            e.atp_start_date,
            e.wta_start_date,
            e.men_start_date,
            e.women_start_date] AS allDates
      UNWIND [d IN allDates WHERE d IS NOT NULL] AS d
      WITH *, min(d) AS start_date
      ORDER BY start_date, r.number DESC, m.match_no DESC
      CALL (e, m) {
        OPTIONAL MATCH (e)-[:ON_SURFACE]->(z:Surface)
        OPTIONAL MATCH (m)-[:PLAYED]->(:Tie)-[:ON_SURFACE]->(z1:Surface)
        RETURN
          CASE
            WHEN z IS NOT NULL THEN properties(z)
            ELSE properties(z1)
          END AS surface
      }
      CALL (e, m) {
        OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
        OPTIONAL MATCH
          (m)-[:PLAYED]->
          (:Tie)-[:TOOK_PLACE_IN]->
          (v1:Venue)-[:LOCATED_IN]->
          (c1:Country)
        WITH
          CASE
            WHEN
              v IS NOT NULL
              THEN apoc.map.merge(properties(v), {country: properties(c)})
            ELSE apoc.map.merge(properties(v1), {country: properties(c1)})
          END AS venue
        RETURN COLLECT(venue) AS venues
      }
      CALL (m, s, e, f) {
        WHEN f:Doubles THEN {
      OPTIONAL MATCH (s)<-[:SCORED]-(pe:Entry)<-[:ENTERED]-(pp:Player)
        WHERE pp.id <> $id
        CALL (pp, e) {
          MATCH (pp)-[:REPRESENTS]->(pc:Country)
          OPTIONAL MATCH
            (pp)-
              [px:REPRESENTED WHERE
                (px.start_date <= e.start_date AND px.end_date > e.start_date) OR
                ('ATP' IN labels(pp) AND
                  px.start_date <= coalesce(e.atp_start_date, e.men_start_date) AND
                  px.end_date > coalesce(e.atp_start_date, e.men_start_date)) OR
                ('WTA' IN labels(pp) AND
                  px.start_date <= coalesce(e.wta_start_date, e.women_start_date) AND
                  px.end_date > coalesce(e.wta_start_date, e.women_start_date))]->
            (pn:Country)
          RETURN
            CASE
              WHEN px IS NOT NULL THEN properties(pn)
              ELSE properties(pc)
            END AS country
        }
        RETURN
          CASE
            WHEN pp IS NULL THEN null
            ELSE
              apoc.map.merge(
                apoc.map.submap(pp, ['id', 'first_name', 'last_name']),
                {country: country, rank: pe.rank}
              )
          END AS partner
      }
      ELSE {
      RETURN null AS partner
      }
      }
      CALL (m, s, r, e) {
        OPTIONAL MATCH
          (s)-[:SCORED]->
          (m)<-[:SCORED]-
          (os:Score)<-[:SCORED]-
          (of:Entry)<-[:ENTERED]-
          (op:Player)
        OPTIONAL MATCH (m)<-[:SCORED]-(:Winner)<-[:SCORED]-(:Entry)<-[:ENTERED]-(w:Player)
        OPTIONAL MATCH (op)-[:REPRESENTS]->(oc:Country)
        OPTIONAL MATCH
          (op)-
            [ox:REPRESENTED WHERE
              (ox.start_date <= e.start_date AND ox.end_date > e.start_date) OR
              ('ATP' IN labels(op) AND
                ox.start_date <= coalesce(e.atp_start_date, e.men_start_date) AND
                ox.end_date > coalesce(e.atp_start_date, e.men_start_date)) OR
              ('WTA' IN labels(op) AND
                ox.start_date <= coalesce(e.wta_start_date, e.women_start_date) AND
                ox.end_date > coalesce(e.wta_start_date, e.women_start_date))]->
          (on:Country)
        WITH
          s,
          m,
          r,
          w,
          os,
          CASE
            WHEN op IS NULL THEN null
            ELSE
              apoc.map.mergeList([
                properties(of),
                apoc.map.submap(op, ['id', 'first_name', 'last_name']),
                {
                  country:
                    CASE
                      WHEN ox IS NOT NULL THEN properties(on)
                      ELSE properties(oc)
                    END
                }
              ])
          END AS opponent
        WITH
          [[s.s1, s.t1], [s.s2, s.t2], [s.s3, s.t3], [s.s4, s.t4], [s.s5, s.t5]] AS playerSets,
          [
            [os.s1, os.t1],
            [os.s2, os.t2],
            [os.s3, os.t3],
            [os.s4, os.t4],
            [os.s5, os.t5]
          ] AS opSets,
          coalesce(m.incomplete, s.incomplete, os.incomplete, null) AS incomplete,
          CASE WHEN m:Main THEN 'Main' ELSE 'Qualifying' END AS draw,
          CASE WHEN m:ATP THEN 'ATP' WHEN m:WTA THEN 'WTA' WHEN m:Men THEN 'ITF (M)' ELSE 'ITF (W)' END AS tour,
          m,
          r,
          w,
          CASE WHEN s.aces IS NULL THEN false ELSE true END AS stats,
          COLLECT(opponent) AS opponents

        WITH
          toString(e.id) + '|' + r.round + '|' + toString(m.match_no) AS matchKey,
          {
            round: r.round,
            match_no: m.match_no,
            incomplete: incomplete,
            winner_id: w.id,
            sets: [
              [x IN playerSets WHERE x[0] IS NOT NULL],
              [x IN opSets WHERE x[0] IS NOT NULL]
            ],
            opponents: opponents,
            draw: draw,
            tour: tour,
            stats: stats
          } AS match

        WITH matchKey, apoc.agg.first(match) AS match
        RETURN match
      }
      WITH
        e,
        t,
        surface,
        f,
        match,
        venues,
        partner,
        [x IN labels(e) WHERE NOT x IN ['Update', 'Event']] AS tours,
        CASE
          WHEN e.category IS NOT NULL THEN e.category
          WHEN p:ATP THEN coalesce(e.atp_category, e.men_category, null)
          ELSE coalesce(e.wta_category, e.women_category, null)
        END AS category,
        CASE
          WHEN e.start_date IS NOT NULL THEN e.start_date
          WHEN p:ATP THEN coalesce(e.atp_start_date, e.men_start_date, null)
          ELSE coalesce(e.wta_start_date, e.women_start_date, null)
        END AS start_date,
        CASE
          WHEN e.end_date IS NOT NULL THEN e.end_date
          WHEN p:ATP THEN coalesce(e.atp_end_date, e.men_end_date, null)
          ELSE coalesce(e.wta_end_date, e.women_end_date, null)
        END AS end_date,
        CASE
          WHEN e.currency IS NOT NULL THEN e.currency
          WHEN p:ATP THEN coalesce(e.atp_currency, e.men_currency, null)
          ELSE coalesce(e.wta_currency, e.women_currency, null)
        END AS currency,
      CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END AS type
      RETURN {
        tours: tours,
        type: type,
        id: e.id,
        name: e.sponsor_name,
        tournament: properties(t),
        category: category,
        start_date: start_date,
        end_date: end_date,
        venues: venues,
        surface: surface,
        currency: currency,
        match: match,
        player: properties(f),
        partner: partner
      } AS event
    `,
    formattedParams
  )

  const statsResults = statsRecords[0].get("stats")
  const activity = activityRecords.map(record => {
    const event = record.get("event")

    const numberKeys = ["seed", "rank", "points", "pm", "q_seed"]

    for (const key of numberKeys) {
      if (event.player[key]) event.player[key] = event.player[key].toInt()
      if (event.partner?.[key]) event.partner[key] = event.partner[key].toInt()
      event.match.opponents.forEach((opponent: any) => {
        if (opponent?.[key]) opponent[key] = opponent[key].toInt()
      })
    }

    for (let i = 0; i < 2; i++) {
      for (let index = 0; index < event.match.sets[i].length; index++) {
        event.match.sets[i][index] = event.match.sets[i][index].map((x: any) => (x ? x.toInt() : null))
      }
    }

    if (CHALLENGER_CATEGORIES.includes(event.category)) {
      event.level = "Challenger"
    } else if (ITF_MEN_CATEGORIES.includes(event.category) || ITF_WOMEN_CATEGORIES.includes(event.category)) {
      event.level = "ITF"
    } else {
      event.level = "Tour"
    }

    event.start_date = {
      year: event.start_date.year.toInt(),
      month: event.start_date.month.toInt(),
      day: event.start_date.day.toInt()
    }

    event.end_date = {
      year: event.end_date.year.toInt(),
      month: event.end_date.month.toInt(),
      day: event.end_date.day.toInt()
    }

    return {
      ...event,
      id: event.id.toInt(),
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

  return {
    stats: statsResults.map((stat: any) => ({
      ...stat,
      value: stat.value.toInt()
    })),
    activity
  }
})
