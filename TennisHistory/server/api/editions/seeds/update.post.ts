export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => seedFormSchema.parse(body))

  let query = ""

  if (params.draw === "Main") {
    query = `/* cypher */
      MATCH (f:Entry {id: $id})-[t:SEEDED]->(:Event)
    `
  } else {
    query = `/* cypher */
      MATCH (f:Entry {id: $id})-[t:Q_SEEDED]->(:Event)
    `
  }

  if ("seed" in params) {
    query +=
      params.draw === "Main"
        ? `
      SET f.seed = $seed
    `
        : `
      SET f.q_seed = $seed
    `
  }

  if ("rank" in params) {
    query += `
      SET t.rank = $rank
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Seed could not be updated" })
  } else {
    return { ok: true }
  }
})
