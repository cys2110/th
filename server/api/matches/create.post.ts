export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => matchFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (e:Event {id: $event})<-[:ROUND_OF]-(r:Round:$($type) {round: $round})
    WITH e, r, [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
    MERGE (m:Match:$($draw):$(tour):$($type):$($noOfSets) {id: $id, match_no: $match_no})
    MERGE (m)-[:PLAYED]->(r)
    SET m.incomplete = $incomplete, m.court = $court, m.date = $date, m.duration = $duration, m.group = $group
  `

  if (params.team1) {
    query += `
      WITH m, tour
      MATCH (f1:Entry {id: $team1})
      MERGE (s1:$(tour):$($draw):$($type):T1:Score {id: $t1.id})
      SET s1 += $t1
      MERGE (f1)-[:SCORED]->(s1)
      MERGE (s1)-[:SCORED]->(m)
    `

    if (params.winner) {
      query +=
        params.winner === 1
          ? `
      SET s1:Winner
    `
          : `
      SET s1:Loser
    `
    }
  }

  if (params.team2) {
    query += `
      WITH m, tour
      MATCH (f2:Entry {id: $team2})
      MERGE (s2:$(tour):$($draw):$($type):T2:Score {id: $t2.id})
      SET s2 += $t2
      MERGE (f2)-[:SCORED]->(s2)
      MERGE (s2)-[:SCORED]->(m)
    `

    if (params.winner) {
      query +=
        params.winner === 1
          ? `
      SET s2:Winner
    `
          : `
      SET s2:Loser
    `
    }
  }

  if (params.umpire) {
    query += `
      WITH m
      MATCH (u:Umpire {id: $umpire})
      MERGE (u)-[:UMPIRED]->(m)
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Match could not be created" })
  } else {
    return { ok: true }
  }
})
