export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => personFormSchema.parse(body))

  const query = `/* cypher */
    MATCH (p:$($type) {id: $id})
    SET p += $person
  `

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    return {
      success: false,
      error: `${params.id} could not be found.`
    }
  } else {
    return { success: true }
  }
})
