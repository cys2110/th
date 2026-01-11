import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (t:Tournament {id: $id})
    WITH [x IN labels(t) WHERE x <> 'Tournament'] AS tours, t

    UNWIND tours AS tour

    MATCH (t)<-[:EDITION_OF]-(ed:Edition)<-[:EVENT_OF]-(e:Event:$(tour))<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match:Singles)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[j:ENTERED]-(p:Player)-[:REPRESENTS]->(c:Country)
    MATCH (ed)-[:IN_YEAR]->(y:Year)
    OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)

    WITH tour, ed, y, p, coalesce(properties(c1), properties(c)) AS country, j
    WHERE j.rank IS NOT NULL
    ORDER BY j.rank DESC

    WITH COLLECT(apoc.map.merge(
      apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
      {
        edId: ed.id,
        year: y.id,
        rank: j.rank,
        country: country
      }
    )) AS players, tour

    RETURN apoc.map.merge(head(players), {round: 'Win', tour: tour}) AS player

    UNION ALL

    WITH ['Final', 'Semifinals', 'Quarterfinals'] AS rounds
    UNWIND rounds AS round
    MATCH (t:Tournament {id: 451})
    WITH [x IN labels(t) WHERE x <> 'Tournament'] AS tours, t, round

    UNWIND tours AS tour
    MATCH (t)<-[:EDITION_OF]-(ed:Edition)<-[:EVENT_OF]-(e:Event:$(tour))<-[:ROUND_OF]-(:Round {round: round})<-[:PLAYED]-(:Match:Singles)<-[:SCORED]-(:Score)<-[:SCORED]-(f:Entry)<-[j:ENTERED]-(p:Player)-[:REPRESENTS]->(c:Country)
    MATCH (ed)-[:IN_YEAR]->(y:Year)
    OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)

    WITH tour, ed, y, p, coalesce(properties(c1), properties(c)) AS country, j, round
    WHERE j.rank IS NOT NULL
    ORDER BY j.rank DESC

    WITH COLLECT(apoc.map.merge(
      apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
      {
        edId: ed.id,
        year: y.id,
        rank: j.rank,
        country: country
      }
    )) AS players, round, tour

    RETURN apoc.map.merge(head(players), {round: round, tour: tour}) AS player
    `,
    { id: int(id) }
  )

  if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tournament with ID ${id} could not be found.`
    })
  }

  const results = records.map(record => {
    const result = record.get("player")
    return tournamentLowestRankedSchema.parse(result)
  })

  return results
})
