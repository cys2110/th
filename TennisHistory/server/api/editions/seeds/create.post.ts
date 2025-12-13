export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => seedFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (e:Event {id: $event})
    MATCH (f:Entry {id: $id})
  `
  if (params.draw === "Main") {
    query += `
      MERGE (f)-[t:SEEDED]->(e)
      SET f.seed = $seed
    `
  } else {
    query += `
      MERGE (f)-[t:Q_SEEDED]->(e)
      SET f.q_seed = $seed
    `
  }

  if (params.rank) {
    query += ", t.rank = $rank"
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Seed could not be created" })
  } else {
    return { ok: true }
  }
})
