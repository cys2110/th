export default defineEventHandler(async event => {
  const { first_name, last_name, type, id } = getQuery(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (s:$($type) {id: $id})
      SET s.first_name = $first_name, s.last_name = $last_name
      RETURN s
    `,
    { first_name, last_name, type, id }
  )

  console.log(
    `Notifications for person update: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: `${type} could not be updated` })
  } else {
    return { ok: true }
  }
})
