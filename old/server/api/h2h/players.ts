export default defineEventHandler(async query => {
  const { p1Id, p2Id } = getQuery(query)

  const { records: p1Details } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p:Player {id: $id})-[:REPRESENTS]->(c:Country)
      OPTIONAL MATCH (p)-[:TURNED_PRO]->(y:Year)
      OPTIONAL MATCH (p)-[:RETIRED]->(y2:Year)
      OPTIONAL MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(t:Singles)-[:PLAYED]->(:Round {round: 'Final'})
      OPTIONAL MATCH (p)-[:ENTERED]->(:Singles)-[:SCORED]->(s:Score)-[:SCORED]->(:Best3|Best5)
      WITH p, y, COUNT(DISTINCT t) AS titles, COUNT(DISTINCT CASE WHEN s:Winner THEN s END) AS wins, COUNT(DISTINCT CASE WHEN s:Loser THEN s END) AS losses, c, y2, [x IN labels(p) WHERE NOT x IN ['Update', 'Coach', 'Player']][0] AS tour
      RETURN apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name', 'pm', 'rh', 'bh', 'dob', 'height', 'ch_singles'], null, false), {country: properties(c), wins: wins, losses: losses, turned_pro: y.id, retired: y2.id, titles: titles, tour: tour}) AS player
    `,
    { id: p1Id }
  )

  const { records: p2Details } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p:Player {id: $id})-[:REPRESENTS]->(c:Country)
      OPTIONAL MATCH (p)-[:TURNED_PRO]->(y:Year)
      OPTIONAL MATCH (p)-[:RETIRED]->(y2:Year)
      OPTIONAL MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(t:Singles)-[:PLAYED]->(:Round {round: 'Final'})
      OPTIONAL MATCH (p)-[:ENTERED]->(:Singles)-[:SCORED]->(s:Score)-[:SCORED]->(:Best3|Best5)
      WITH p, y, COUNT(DISTINCT t) AS titles, COUNT(DISTINCT CASE WHEN s:Winner THEN s END) AS wins, COUNT(DISTINCT CASE WHEN s:Loser THEN s END) AS losses, c, y2, [x IN labels(p) WHERE NOT x IN ['Update', 'Coach', 'Player']][0] AS tour
      RETURN apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name', 'pm', 'rh', 'bh', 'dob', 'height', 'ch_singles'], null, false), {country: properties(c), wins: wins, losses: losses, turned_pro: y.id, retired: y2.id, titles: titles, tour: tour}) AS player
    `,
    { id: p2Id }
  )

  const { records: wl } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (:Player {id: $p1Id})-[:ENTERED]->(:Singles)-[:SCORED]->(s1:Winner)-[:SCORED]->(:Best3|Best5)<-[:SCORED]-(:Loser)<-[:SCORED]-(:Singles)<-[:ENTERED]-(:Player {id: $p2Id})
      OPTIONAL MATCH (:Player {id: $p2Id})-[:ENTERED]->(:Singles)-[:SCORED]->(s2:Winner)-[:SCORED]->(:Best3|Best5)<-[:SCORED]-(:Loser)<-[:SCORED]-(:Singles)<-[:ENTERED]-(:Player {id: $p1Id})
      RETURN COUNT(DISTINCT s1) AS p1, COUNT(DISTINCT s2) AS p2
    `,
    { p1Id, p2Id }
  )

  const numberKeys = ["pm", "ch_singles", "height", "wins", "losses", "titles", "turned_pro", "retired"]

  const p1 = p1Details[0].get("player")
  const p2 = p2Details[0].get("player")
  const p1Wins = wl[0].get("p1")
  const p2Wins = wl[0].get("p2")

  for (const key of numberKeys) {
    if (p1[key]) p1[key] = p1[key].toInt()
    if (p2[key]) p2[key] = p2[key].toInt()
  }

  if (p1["dob"])
    p1["dob"] = {
      year: p1["dob"].year.toInt(),
      month: p1["dob"].month.toInt(),
      day: p1["dob"].day.toInt()
    }

  if (p2["dob"])
    p2["dob"] = {
      year: p2["dob"].year.toInt(),
      month: p2["dob"].month.toInt(),
      day: p2["dob"].day.toInt()
    }

  return {
    p1,
    p2,
    p1Wins: p1Wins?.toInt(),
    p2Wins: p2Wins?.toInt()
  }
})
