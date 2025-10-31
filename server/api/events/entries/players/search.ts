export default defineEventHandler(async event => {
  const { search, id } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    OPTIONAL MATCH (p:Player)-[:ENTERED]->(f:Entry) WHERE f.id STARTS WITH $id AND p.first_name || ' ' || p.last_name =~ '(?i).*'+ $search + '(?i).*'
    WITH DISTINCT p
    ORDER BY p.last_name, p.first_name
    RETURN {value: p.id, label: p.first_name || ' ' || p.last_name } AS entry
    LIMIT 40
    `,
    { search, id }
  )

  const results = records.map(r => r.get("entry"))

  return results
})
