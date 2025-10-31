import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (t:Tournament {id: $id})
      OPTIONAL MATCH (t)-[:ESTABLISHED]->(e:Year)
      OPTIONAL MATCH (t)-[:ABOLISHED]->(a:Year)
      RETURN
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

  console.log(
    `Notifications for tournament: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  const results = records[0].get("tournament")

  const numberKeys: (keyof typeof results)[] = ["id", "established", "abolished"]
  numberKeys.forEach(key => {
    if (results[key]) {
      results[key] = results[key].toInt()
    }
  })

  results["updated_at"] = results["updated_at"]?.toStandardDate().toISOString().slice(0, 10)

  return results
})
