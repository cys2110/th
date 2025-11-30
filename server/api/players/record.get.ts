export default defineEventHandler(async query => {
  const { id } = getQuery(query)

  const { records: singlesRecords } = await useDriver().executeQuery(
    `/* cypher */
      WITH [580, 520, 540, 560, 605, 96] AS tournamentIds
      MATCH (p:Player {id: $id})
      UNWIND tournamentIds AS tid
      MATCH (t:Tournament {id: tid})<-[:EDITION_OF]-(ed:Edition)-[:IN_YEAR]->(y:Year)
      MATCH (e:Event)-[:EVENT_OF]->(ed)
      OPTIONAL MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(:Singles)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e)
      OPTIONAL MATCH (p)-[:ENTERED]->(f:Singles)-[:ALTERNATE]->(e)
      WITH *
      ORDER BY y.id, r.number

      WITH
        properties(t) AS tournament,
        y.id AS year,
        CASE
          WHEN COUNT(r) = 0 AND COUNT(f) = 0 THEN []
          ELSE COLLECT(CASE WHEN s:Winner AND r.round = 'Final' THEN 'Win' WHEN s IS NULL AND f.status = 'AL' THEN 'Alternate' ELSE r.round END)
        END AS rounds

      WITH
        tournament,
        year,
        CASE
          WHEN SIZE(rounds) = 0 THEN null
          ELSE head(rounds)
        END AS round

      RETURN CASE WHEN round IS NULL THEN null ELSE {
        tournament: tournament,
        year: year,
        round: round
      } END AS results
    `,
    { id }
  )

  const { records: doublesRecords } = await useDriver().executeQuery(
    `/* cypher */
      WITH [580, 520, 540, 560, 605, 96] AS tournamentIds
      MATCH (p:Player {id: $id})
      UNWIND tournamentIds AS tid
      MATCH (t:Tournament {id: tid})<-[:EDITION_OF]-(ed:Edition)-[:IN_YEAR]->(y:Year)
      MATCH (e:Event)-[:EVENT_OF]->(ed)
      OPTIONAL MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(:Doubles)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e)
      OPTIONAL MATCH (p)-[:ENTERED]->(f:Doubles)-[:ALTERNATE]->(e)
      WITH *
      ORDER BY y.id, r.number

      WITH
        properties(t) AS tournament,
        y.id AS year,
        CASE
          WHEN COUNT(r) = 0 AND COUNT(f) = 0 THEN []
          ELSE COLLECT(CASE WHEN s:Winner AND r.round = 'Final' THEN 'Win' WHEN s IS NULL AND f.status = 'AL' THEN 'Alternate' ELSE r.round END)
        END AS rounds

      WITH
        tournament,
        year,
        CASE
          WHEN SIZE(rounds) = 0 THEN null
          ELSE head(rounds)
        END AS round

      RETURN CASE WHEN round IS NULL THEN null ELSE {
        tournament: tournament,
        year: year,
        round: round
      } END AS results
    `,
    { id }
  )

  const singlesResults = singlesRecords.map(record => {
    const result = record.get("results")
    if (!result) return null

    return playerRecordSchema.parse(result)
  })
  const doublesResults = doublesRecords.map(record => {
    const result = record.get("results")
    if (!result) return null
    return playerRecordSchema.parse(result)
  })

  const allYears = [...new Set([...singlesResults.filter(Boolean).map(r => r?.year), ...doublesResults.filter(Boolean).map(r => r?.year)])]

  const combinedResults = allYears.map(year => {
    const tournaments = [580, 520, 540, 560, 605, 96]

    const result: { year: number; [key: string]: any } = {
      year: year as number,
      "580": {},
      "520": {},
      "540": {},
      "560": {},
      "605": {},
      "96": {}
    }

    tournaments.forEach(tid => {
      const singlesResult = singlesResults.find(r => r?.year === year && r?.tournament.id === tid)
      const doublesResult = doublesResults.find(r => r?.year === year && r?.tournament.id === tid)

      if (singlesResult) {
        result[tid.toString()]["singles"] = singlesResult.round
      }

      if (doublesResult) {
        result[tid.toString()]["doubles"] = doublesResult.round
      }
    })

    return result
  })

  return combinedResults.sort((a: any, b: any) => b.year - a.year)
})
