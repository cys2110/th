export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => matchFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (s1:T1)-[:SCORED]->(m:Match {id: $id})<-[:SCORED]-(s2:T2)
    SET s1 += $t1, s2 += $t2, m.court = $court, m.date = $date, m.duration = $duration, m.incomplete = $incomplete, m.match_no = $match_no, m.group = $group
  `

  if (params.umpire) {
    query += `
      WITH m
      OPTIONAL MATCH (:Umpire)-[t:UMPIRED]->(m)
      DELETE t
      WITH m
      MATCH (u:Umpire {id: $umpire})
      MERGE (u)-[:UMPIRED]->(m)
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Match could not be updated" })
  } else {
    return { ok: true }
  }
})
