export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => entryFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (p:Player {id: $id})-[t:ENTERED]->(f:Entry:$($type)) WHERE f.id STARTS WITH $event
    SET f += $entry
  `

  if ("rank" in params) {
    query += `
      SET t.rank = $rank
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Entry could not be updated" })
  } else {
    return { ok: true }
  }
})
