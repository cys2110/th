export default defineEventHandler(async query => {
  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (u:Coach) WHERE NOT u:Player
      MATCH (p:Player) WHERE u.id <> p.id AND apoc.text.compareCleaned(u.id, p.first_name || ' ' || p.last_name)
      RETURN {coach: u.id, player: p.id, player_name: p.first_name || ' ' || p.last_name} AS result
      LIMIT 40
    `
  )

  const results = records.map(record => record.get("result"))

  return results
})
