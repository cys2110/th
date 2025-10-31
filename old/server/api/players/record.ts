export default defineEventHandler(async query => {
  const { id } = getQuery(query)

  const { records: singlesRecords } = await useDriver().executeQuery(
    `/* cypher */
      WITH [580, 520, 540, 560, 605, 96] AS tournamentIds
      MATCH (p:Player {id: $id})
      UNWIND tournamentIds AS tid
      MATCH (t:Tournament {id: tid})
      OPTIONAL MATCH
        (p)-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (m:Singles)-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event)-[:EDITION_OF]->
        (t)
      OPTIONAL MATCH (e)-[:IN_YEAR]->(y:Year)
      WITH *
      ORDER BY e.start_date
      WITH tid, t, e, y, collect({round: r, score: s}) AS match_data
      WITH
        tid,
        t,
        e,
        y,
        reduce(
          minNum = 999,
          x IN
          match_data |
            CASE
              WHEN
                x.round.number IS NOT NULL AND x.round.number < minNum
                THEN x.round.number
              ELSE minNum
            END) AS min_round,
        match_data
      WITH
        tid,
        t,
        y,
        e,
        min_round,
        head([x IN match_data WHERE x.round.number = min_round]) AS best_match
      RETURN
        CASE
          WHEN
            e IS NOT NULL
            THEN
              {
                id: e.id,
                tournament: properties(t),
                year: y.id,
                round:
                  CASE
                    WHEN
                      best_match.score:Winner AND best_match.round.round = 'Final'
                      THEN 'Win'
                    ELSE best_match.round.round
                  END,
                number:
                  CASE
                    WHEN
                      best_match.score:Winner AND best_match.round.round = 'Final'
                      THEN 0
                    ELSE best_match.round.number
                  END
              }
        END AS resultsPerTid
    `,
    { id }
  )

  const { records: doublesRecords } = await useDriver().executeQuery(
    `/* cypher */
      WITH [580, 520, 540, 560, 605, 96] AS tournamentIds
      MATCH (p:Player {id: $id})
      UNWIND tournamentIds AS tid
      MATCH (t:Tournament {id: tid})
      OPTIONAL MATCH
        (p)-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (m:Doubles)-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (e:Event)-[:EDITION_OF]->
        (t)
      OPTIONAL MATCH (e)-[:IN_YEAR]->(y:Year)
      WITH *
      ORDER BY e.start_date
      WITH tid, t, e, y, collect({round: r, score: s}) AS match_data
      WITH
        tid,
        t,
        e,
        y,
        reduce(
          minNum = 999,
          x IN
          match_data |
            CASE
              WHEN
                x.round.number IS NOT NULL AND x.round.number < minNum
                THEN x.round.number
              ELSE minNum
            END) AS min_round,
        match_data
      WITH
        tid,
        t,
        y,
        e,
        min_round,
        head([x IN match_data WHERE x.round.number = min_round]) AS best_match
      RETURN
        CASE
          WHEN
            e IS NOT NULL
            THEN
              {
                id: e.id,
                tournament: properties(t),
                year: y.id,
                round:
                  CASE
                    WHEN
                      best_match.score:Winner AND best_match.round.round = 'Final'
                      THEN 'Win'
                    ELSE best_match.round.round
                  END,
                number:
                  CASE
                    WHEN
                      best_match.score:Winner AND best_match.round.round = 'Final'
                      THEN 0
                    ELSE best_match.round.number
                  END
              }
        END AS resultsPerTid
    `,
    { id }
  )

  const singlesResults = singlesRecords.map(record => record.get("resultsPerTid"))
  const doublesResults = doublesRecords.map(record => record.get("resultsPerTid"))

  const usedIds = new Set()

  const combinedResults = []

  for (const event of singlesResults.filter(Boolean)) {
    console.log(doublesResults.filter(Boolean))
    const doublesResult = doublesResults.filter(Boolean).find(dr => dr.id.toInt() === event.id.toInt())

    combinedResults.push({
      id: event.id.toInt(),
      year: event.year?.toInt(),
      tournament: {
        ...event.tournament,
        id: event.tournament.id?.toInt()
      },
      singles: {
        round: event.round,
        number: event.number?.toInt()
      },
      doubles:
        doublesResult ?
          {
            round: doublesResult.round,
            number: doublesResult.number?.toInt()
          }
        : null
    })

    usedIds.add(event.id.toInt())
  }

  for (const result of doublesResults.filter(Boolean)) {
    if (!usedIds.has(result.id.toInt())) {
      combinedResults.push({
        ...result,
        id: result.id.toInt(),
        year: result.year?.toInt(),
        tournament: {
          ...result.tournament,
          id: result.tournament.id?.toInt()
        },
        singles: null,
        doubles: {
          round: result.round,
          number: result.number?.toInt()
        }
      })
    }
  }

  return combinedResults.sort((a: any, b: any) => b.year - a.year)
})
