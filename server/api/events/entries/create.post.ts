export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => entryFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (e:Event {id: $event})
    MATCH (p1:Player {id: $player1})
  `
  if (params.player2) {
    query += `
      MATCH (p2:Player {id: $player2})
      MERGE (f:Entry:$($type) {id: $event || ' ' || $player1 || ' ' || $player2})
      MERGE (p1)-[t1:ENTERED]->(f)
      MERGE (p2)-[t2:ENTERED]->(f)
    `

    if (params.rank2) {
      query += `
        SET t2.rank = $rank2
      `
    }
  } else {
    query += `
      MERGE (f:Entry:$($type) {id: $event || ' ' || $player1})
      MERGE (p1)-[t1:ENTERED]->(f)
    `
  }

  if (params.seed) {
    query += `
      SET f.seed = $seed
    `
  }

  if (params.status) {
    query += `
      SET f.status = $status
    `
  }

  if (params.points) {
    query += `
      SET f.points = $points
    `
  }

  if (params.pm) {
    query += `
      SET f.pm = $pm
    `
  }

  if (params.q_seed) {
    query += `
      SET f.q_seed = $q_seed
    `
  }

  if (params.q_status) {
    query += `
      SET f.q_status = $q_status
    `
  }

  if (params.rank) {
    query += `
      SET t1.rank = $rank
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Entry could not be created" })
  } else {
    return { ok: true }
  }
})
