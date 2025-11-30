export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => awardFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (r:Round {id: $id})
  `

  if ("points" in params) {
    query += `
      SET r.points = $points
    `
  }

  if ("pm" in params) {
    query += `
      SET r.pm = $pm
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Round could not be updated" })
  } else {
    return { ok: true }
  }
})
