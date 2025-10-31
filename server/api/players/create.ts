export default defineEventHandler(async event => {
  const { id, tour } = getQuery(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MERGE (p:Player:$($tour) {id: $id})
    `,
    { id, tour }
  )

  console.log(
    `Notifications for player creation: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Player could not be created" })
  } else {
    return { ok: true }
  }
})
