export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => personFormSchema.parse(body))

  let query = `/* cypher */
      MATCH (s:$($type) {id: $id})
    `

  if ("first_name" in params) {
    query += `
      SET s.first_name = $first_name
    `
  }

  if ("last_name" in params) {
    query += `
      SET s.last_name = $last_name
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({
      statusCode: 404,
      statusMessage: `${params.type} could not be updated`
    })
  } else {
    return { ok: true }
  }
})
