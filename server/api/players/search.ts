export default defineEventHandler(async event => {
  const { search } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (p:Player) WHERE p.first_name + ' ' + p.last_name =~ '(?i).*'+ $search + '(?i).*'
      RETURN apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false) AS player
      ORDER BY p.last_name
      LIMIT 40
    `,
    { search }
  )

  const results = records.map(r => {
    const player = r.get("player")
    return { value: player.id, label: player.first_name + " " + player.last_name }
  })

  return results
})
