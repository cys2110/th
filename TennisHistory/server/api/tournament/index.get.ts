import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const query = `/* cypher */
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
  `

  const { records, summary } = await useDriver().executeQuery(query, { id: int(id) })

  if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tournament with ID ${id} could not be found.`
    })
  }

  const results = records[0].get("tournament")

  return tournamentSchema.parse(results)
})
