export default defineEventHandler(async event => {
  const { search } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (p:Coach) WHERE p.first_name + ' ' + p.last_name =~ '(?i).*'+ $search + '(?i).*'
      RETURN apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false) AS coach
      ORDER BY p.last_name
      LIMIT 40
    `,
    { search }
  )

  const results = records.map(r => {
    const coach = r.get("coach")
    return { value: coach.id, label: coach.first_name + " " + coach.last_name }
  })

  return results
})
