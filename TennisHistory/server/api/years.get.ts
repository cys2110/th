import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records: tournamentRecords } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (y:Year {id: $id})
      MATCH (t:Tournament)-[t1:ESTABLISHED|ABOLISHED]->(y)
      WITH *
      ORDER BY t.name
      RETURN apoc.map.merge(properties(t), {type: type(t1)}) AS result

    `,
    { id: int(id) }
  )

  const { records: playerRecords } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH (y:Year {id: $id})
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)
      WHERE
        p.dob.year = y.id OR
        p.dod.year = y.id OR
        (p)-[:HOF]->(y) OR
        (p)-[:TURNED_PRO|RETIRED]->(y)
      WITH *
      ORDER BY p.last_name
      OPTIONAL MATCH (p)-[p1:TURNED_PRO|RETIRED]->(y)
      OPTIONAL MATCH (p)-[p2:HOF]->(y)
      RETURN
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name']),
          {
            country: properties(c),
            type:
              CASE
                WHEN p1 IS NOT NULL THEN type(p1)
                WHEN p.dob.year = y.id THEN 'Born'
                WHEN p.dod.year = y.id THEN 'Died'
                ELSE 'Hall of Fame Induction'
              END
          }
        ) AS result
      `,
    { id: int(id) }
  )

  const tournamentResults = tournamentRecords.map(record => record.get("result"))
  const playerResults = playerRecords.map(record => record.get("result"))

  return yearsSchema.parse({
    tournaments: tournamentResults,
    players: playerResults
  })
})
