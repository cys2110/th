export default defineEventHandler(async event => {
  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (c1:Country)<-[:REPRESENTS]-(p1:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(s1:Score)-[:SCORED]->(m:Singles)<-[:SCORED]-(:Score)<-[:SCORED]-(:Entry)<-[:ENTERED]-(p2:Player)-[:REPRESENTS]->(c2)
    WHERE elementId(p1) < elementId(p2)
    WITH p1, p2, c1, c2, m, s1
    WITH p1, p2, c1, c2,
        count(DISTINCT m) AS matches,
        count(DISTINCT CASE WHEN s1:Winner THEN m END) AS p1Wins,
        count(DISTINCT CASE WHEN s1:Loser  THEN m END) AS p2Wins
    RETURN apoc.map.merge(apoc.map.submap(p1, ['id', 'first_name', 'last_name'], null, false), {country: properties(c1)}) AS p1, apoc.map.merge(apoc.map.submap(p2, ['id', 'first_name', 'last_name'], null, false), {country: properties(c2)}) AS p2, p1Wins, p2Wins
    ORDER BY matches DESC
    LIMIT 20
    `
  )

  const results = records.map(record => {
    const r = record.toObject()

    return {
      p1: r.p1,
      p2: r.p2,
      p1Wins: r.p1Wins.toInt(),
      p2Wins: r.p2Wins.toInt()
    }
  })

  return results
})
