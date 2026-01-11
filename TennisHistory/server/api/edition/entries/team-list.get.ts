export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery(event)

    const query = `/* cypher */
      MATCH (p:Player)-[:ENTERED]->(f:Entry) WHERE f.id STARTS WITH $edId

      WITH f, p
      ORDER BY toLower(p.last_name), toLower(p.first_name), p.id

      WITH f, COLLECT(DISTINCT p.first_name || ' ' || p.last_name) AS label

      RETURN {value: f.id, label: apoc.text.join(label, ' / ')} AS result
    `

    const { records } = await useDriver().executeQuery(query, { edId })

    const results = records.map(record => record.get("result"))

    return results as Array<{ value: string | number; label: string }>
  } catch (error) {
    throw error
  }
})
