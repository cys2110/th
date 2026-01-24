import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      OPTIONAL MATCH (p:Player {id: $id})-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (m:Singles)<-[:SCORED]-
        (:Score)<-[:SCORED]-
        (:Entry)<-[:ENTERED]-
        (opponent:Player)
      OPTIONAL MATCH (opponent)-[:REPRESENTS]->(c:Country)

      WITH apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(
            opponent,
            ['id', 'first_name', 'last_name'],
            null,
            false
          ),
          { country: properties(c) }
        ),
        [],
        [null]
      ) AS opponent,
      COUNT(m) AS matches,
      COUNT(CASE WHEN s:Winner THEN s END) AS wins
      WHERE matches > 0
      ORDER BY matches DESC, wins DESC
      LIMIT 10

      RETURN opponent, matches - wins AS losses, wins
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.id} could not be found.`
      })
    }

    const results = records.map(record => {
      const result = record.toObject()
      return playerH2HSchema.parse(result)
    })

    return results
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
