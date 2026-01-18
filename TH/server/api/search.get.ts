import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      OPTIONAL MATCH (n:Player) WHERE n.first_name || ' ' || n.last_name =~ '(?i).*' + $searchTerm + '(?i).*'
      MATCH (n)-[:REPRESENTS]->(c:Country)

      RETURN apoc.map.merge(
        apoc.map.submap(n, ['id', 'first_name', 'last_name']),
        {
          country: properties(c),
          tour: [x IN labels(n) WHERE x IN ['ATP', 'WTA']][0]
        }
      ) AS result

      ORDER BY toLower(result.last_name), toLower(result.first_name)
      LIMIT 20

      UNION

      OPTIONAL MATCH (n:Tournament) WHERE n.name =~ '(?i).*' + $searchTerm + '(?i).*'

      RETURN properties(n) AS result

      ORDER BY toLower(result.name)
      LIMIT 20
    `

    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("result")

      return searchResultsSchema.parse(result)
    })

    return results
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
      })
    }

    console.error(error)
    throw error
  }
})
