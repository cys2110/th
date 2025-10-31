export default defineEventHandler(async event => {
  const { search } = getQuery(event)

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
    return { value: umpire.id, label: umpire.id }
  })

  return results
})
