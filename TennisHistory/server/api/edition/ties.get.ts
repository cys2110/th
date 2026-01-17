export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery(event)

    const query = `/* cypher */
      MATCH (t:Tie)-[:TIE_OF]->(r:Round) WHERE r.id STARTS WITH $edId

      WITH t, r
      ORDER BY r.number, t.number

      RETURN t.id AS tie
    `

    const { records } = await useDriver().executeQuery(query, { edId })

    const results = records.map(record => record.get("tie"))

    return results as string[]
  } catch (error) {
    throw error
  }
})
