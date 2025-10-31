export default defineEventHandler(async event => {
  const { search, id, tour, matchType } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    OPTIONAL MATCH (p1:Player)-[:ENTERED]->(f:Entry:$($matchType) WHERE f.id STARTS WITH $id) WHERE p1.first_name || ' ' || p1.last_name =~ '(?i).*'+ $search + '(?i).*'
    CALL (f) {
      MATCH (p:Player)-[:ENTERED]->(f)
      RETURN p
    }
    WITH f.id AS id, COLLECT(DISTINCT p.first_name || ' ' || p.last_name) AS label
    RETURN {value: id, label: label } AS entry
    ORDER BY entry.value
    LIMIT 40
    `,
    { search, id: `${id}-${tour}`, matchType }
  )

  const results = records.map(r => {
    const entry = r.get("entry")
    entry.label = entry.label.join(" / ")
    return entry
  })

  return results
})
