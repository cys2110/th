import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params: { team1Ids: string[]; team2Ids: string[] } = await readBody(event)

    let query = `/* cypher */
    CYPHER 25
  `

    if (params.team1Ids.length === 2) {
      query += `/* cypher */
        MATCH (:Player {id: $team1Ids[0]})-[:ENTERED]->(f1:Entry)<-[:ENTERED]-(:Player {id: $team1Ids[1]})
        MATCH (:Player {id: $team2Ids[0]})-[:ENTERED]->(f2:Entry)<-[:ENTERED]-(:Player {id: $team2Ids[1]})
      `
    } else {
      query += `/* cypher */
        MATCH (:Player {id: $team1Ids[0]})-[:ENTERED]->(f1:Entry)
        MATCH (:Player {id: $team2Ids[0]})-[:ENTERED]->(f2:Entry)
      `
    }

    query += `/* cypher */
      MATCH (f1)-[:SCORED]->(s1:Score)-[:SCORED]->(m:Match)<-[:SCORED]-(s2:Score)<-[:SCORED]-(f2)
      MATCH (m)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament)
      MATCH (ed)-[:IN_YEAR]->(y:Year)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)

      WITH
        m,
        s1,
        s2,
        r,
        ed,
        y,
        t,
        coalesce(properties(eds), properties(es)) AS surface,
        coalesce(ed.start_date, e.start_date) AS start_date,
        CASE WHEN s1:Winner THEN 't1' WHEN s2:Winner THEN 't2' ELSE NULL END AS winning_team,
        [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0] AS level,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour,
        [
          [s1.s1, s1.t1],
          [s1.s2, s1.t2],
          [s1.s3, s1.t3],
          [s1.s4, s1.t4],
          [s1.s5, s1.t5]
        ] AS t1Sets,
        [
          [s2.s1, s2.t1],
          [s2.s2, s2.t2],
          [s2.s3, s2.t3],
          [s2.s4, s2.t4],
          [s2.s5, s2.t5]
        ]  AS t2Sets
      ORDER BY start_date

      WITH
        m,
        s1,
        s2,
        r,
        ed,
        y,
        t,
        surface,
        winning_team,
        level,
        tour,
        CASE WHEN s1:Winner THEN [
          [x IN t1Sets WHERE x[0] IS NOT NULL],
          [x IN t2Sets where x[0] IS NOT NULL]
        ] ELSE [
          [x IN t2Sets WHERE x[0] IS NOT NULL],
          [x IN t1Sets where x[0] IS NOT NULL]
        ] END AS sets

      RETURN apoc.map.clean(
        {
          winning_team: winning_team,
          round: r.round,
          incomplete: coalesce(s1.incomplete, s2.incomplete, null),
          stats: CASE WHEN s1.aces IS NOT NULL THEN true ELSE false END,
          surface: surface,
          year: y.id,
          tournament: properties(t),
          id: ed.id,
          match_no: m.match_no,
          sets: sets,
          level: level,
          tour: tour
        }, [], [null]
      ) AS match
    `

    const { records } = await useDriver().executeQuery(query, params)

    const matches = records.map(record => {
      const match = record.get("match")

      return h2hMatchSchema.parse(match)
    })

    return matches
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
