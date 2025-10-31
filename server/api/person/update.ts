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

  if (summary.counters.updates().nodesCreated === 0) {
    throw createError({ statusCode: 400, statusMessage: `${type} could not be updated` })
  } else {
    return { ok: true }
  }
})
