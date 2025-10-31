export default defineEventHandler(async query => {
  const { search } = getQuery(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (t:Tournament) WHERE t.name =~ '(?i).*'+ $search + '(?i).*'
      RETURN properties(t) AS tournament
      ORDER BY t.name
      LIMIT 40
    `,
    { search }
  )

  const results = records.map(r => {
    const tournament = r.get("tournament")
    return { value: tournament.id.toInt(), label: tournament.name }
  })

  return results
})
