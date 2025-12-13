export default defineEventHandler(async event => {
  const { records: playerRecords } = await useDriver().executeQuery(`/* cypher */
      WITH range(1, 10) AS ranks
      UNWIND ranks AS rank
      MATCH (p:Player:ATP {current_singles: rank})-[:REPRESENTS]->(c:Country)
      RETURN
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name', 'current_singles']),
          {country: properties(c)}
        ) AS player
    `)

  const { records } = await useDriver().executeQuery(`/* cypher */
    WITH range(1, 10) AS ranks
    UNWIND ranks AS rank
    MATCH (p:Player:ATP {current_singles: rank})

    WITH p, ranks
    UNWIND ranks AS rank
    MATCH (o:Player:ATP {current_singles: rank})
    MATCH
      (p)-[:ENTERED]->
      (:Singles)-[:SCORED]->
      (s:Score)-[:SCORED]->
      (:BestOf3|BestOf5)<-[:SCORED]-
      (:Score)<-[:SCORED]-
      (:Entry)<-[:ENTERED]-(o)
    WITH
      p.id AS player,
      o.id AS opponent,
      p,
      o,
      SUM(CASE WHEN s:Winner THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN s:Loser THEN 1 ELSE 0 END) AS losses
    ORDER BY p.current_singles, o.current_singles

    WITH player, collect({opponent: opponent, wins: wins, losses: losses}) AS h2hList

    WITH player,
        reduce(m = {player: player}, h IN h2hList |
          apoc.map.setKey(
            m,
            toString(h.opponent),
            toString(h.wins) + '-' + toString(h.losses)
          )
        ) AS row
    RETURN row AS h2h;
  `)

  const players = playerRecords.map(record => {
    const player = record.get("player")

    return h2hPlayerSchema.parse(player)
  })

  const results = records.map(record => {
    const h2h = record.get("h2h")

    return h2hBaseSchema.parse(h2h)
  })

  return {
    players,
    results
  }
})
