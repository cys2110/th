export default defineEventHandler(async event => {
  const { records } = await useDriver().executeQuery(`/* cypher */
    WITH range(1, 10) AS ranks
    UNWIND ranks AS rank
    MATCH (p:Player:ATP {current_singles: rank})-[:REPRESENTS]->(c:Country)

    WITH p, c, ranks
    UNWIND ranks AS rank
    MATCH (p)-[:ENTERED]->(:Singles)-[:SCORED]->(s:Score)-[:SCORED]->(:BestOf3|BestOf5)<-[:SCORED]-(:Score)<-[:SCORED]-(:Entry)<-[:ENTERED]-(o:Player {current_singles: rank})-[:REPRESENTS]->(c1:Country)
    WITH apoc.map.merge(
      apoc.map.submap(p, ['id', 'first_name', 'last_name', 'current_singles']),
      { country: properties(c)}
    ) AS player, apoc.map.merge(
        apoc.map.submap(o, ['id', 'first_name', 'last_name', 'current_singles']),
        { country: properties(c1)}
      ) AS opponent,
      SUM(CASE WHEN s:Winner THEN 1 ELSE 0 END) AS wins,
      COUNT(DISTINCT s) AS matches
    WITH COLLECT({
      opponent: opponent,
      wins: wins,
      matches: matches
    }) AS h2h, player
    RETURN {
      player: player,
      h2h: h2h
    } AS player
  `)

  const results = records.map(record => {
    const player = record.get("player")

    return h2hBaseSchema.parse(player)
  })

  return results
})
