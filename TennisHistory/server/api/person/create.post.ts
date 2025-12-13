export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => personFormSchema.parse(body))

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MERGE (s:$($type) {id: $id})
      SET s += $person
    `,
    params
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({
      statusCode: 404,
      statusMessage: `${params.type} could not be created`
    })
  } else {
    return { ok: true }
  }
})
