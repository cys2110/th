import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (t:Tournament {id: $id})
      OPTIONAL MATCH (t)-[:ESTABLISHED]->(e:Year)
      OPTIONAL MATCH (t)-[:ABOLISHED]->(a:Year)
      RETURN
      // Remove null values from the returned map
        apoc.map.clean(
          apoc.map.merge(
            properties(t),
            {
              tours: [x IN labels(t) WHERE x <> 'Tournament'],
              established: e.id,
              abolished: a.id
            }
          ),
          [],
          [null]
        ) AS tournament
    `,
    { id: int(id) }
  )

  const results = records[0].get("tournament")

  return tournamentSchema.parse(results)
})
