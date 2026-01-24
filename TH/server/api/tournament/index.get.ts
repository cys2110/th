import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await getValidatedQuery(event, query => idSchema.parse(query))

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

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.id.toInt()} could not be found.`
      })
    }

    const results = records[0]!.get("tournament")

    return tournamentSchema.parse(results)
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: error.issues.map(i => ({
          [i.path.join(".")]: {
            message: i.message,
            received: i.input
          }
        }))
      })
    }

    console.error(error)
    throw error
  }
})
