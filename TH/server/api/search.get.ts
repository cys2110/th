import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      OPTIONAL MATCH (p:Player) WHERE p.first_name || ' ' || p.last_name =~ '(?i).*' + $searchTerm + '(?i).*'
      MATCH (p)-[:REPRESENTS]->(c:Country)

      RETURN
        apoc.map.merge(
          apoc.map.submap(
            p,
            ['id', 'first_name', 'last_name']
          ),
          {
            country: properties(c),
            tour: [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0]
          }
        ) AS result

      ORDER BY toLower(result.last_name), toLower(result.first_name)
      LIMIT 20

      UNION

      OPTIONAL MATCH (t:Tournament) WHERE t.name =~ '(?i).*' + $searchTerm + '(?i).*'

      RETURN properties(t) AS result

      ORDER BY toLower(result.name)
      LIMIT 20
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `No results found for ${params.searchTerm}.`
      })
    }

    const results = records.map(record => {
      const result = record.get("result")

      if (!result) return null

      return searchResultsSchema.parse(result)
    })

    return results.filter(Boolean) as SearchResultsType[]
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
