export default defineEventHandler(async query => {
  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (u:Coach)-[:COACHES]->(pc:Player) WHERE NOT u:Player
      MATCH (p:Player) WHERE u.id <> p.id AND apoc.text.compareCleaned(u.id, p.first_name || ' ' || p.last_name)
      WITH u, p, COLLECT(pc.first_name || ' ' || pc.last_name) AS coached_players
      RETURN {coach: u.id, player: p.id, player_name: p.first_name || ' ' || p.last_name, coached_players: coached_players} AS result
      LIMIT 40
    `
  )

  const results = records.map(record => record.get("result"))

  return results as {
    coach: string
    player: string
    player_name: string
    coached_players: string[]
  }[]
})
