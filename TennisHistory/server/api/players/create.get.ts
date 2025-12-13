export default defineEventHandler(async event => {
  const { id, tour } = getQuery(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MERGE (p:Player:$($tour) {id: $id})
    `,
    { id, tour }
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Player could not be created" })
  } else {
    return { ok: true }
  }
})
