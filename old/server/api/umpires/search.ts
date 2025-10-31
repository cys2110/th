export default defineEventHandler(async query => {
  const { search } = getQuery(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (u:Umpire) WHERE u.id =~ '(?i).*'+ $search + '(?i).*'
      RETURN properties(u) AS umpire
      ORDER BY umpire.last_name
      LIMIT 40
    `,
    { search }
  )

  const results = records.map(r => {
    const umpire = r.get("umpire")
    return { id: umpire.id, label: umpire.id }
  })

  return results
})
