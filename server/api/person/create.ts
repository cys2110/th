export default defineEventHandler(async event => {
  const { first_name, last_name, type } = getQuery(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MERGE (s:$($type) {first_name: $first_name, last_name: $last_name})
      ON CREATE SET s.id = s.first_name || ' ' || s.last_name
      RETURN s
    `,
    { first_name, last_name, type }
  )

  console.log(
    `Notifications for person creation: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: `${type} could not be created` })
  } else {
    return { ok: true }
  }
})
