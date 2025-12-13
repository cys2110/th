export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => awardFormSchema.parse(body))

  const query = `/* cypher */
    MATCH (e:Event {id: $event})
    MERGE (r:Round:$($draw):$($type):$($tour) {id: $id })
    SET r += $round
    MERGE (r)-[:ROUND_OF]->(e)
  `

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Round could not be created" })
  } else {
    return { ok: true }
  }
})
