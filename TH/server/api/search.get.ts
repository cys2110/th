import { ZodError } from "zod"

export default defineEventHandler(async event => {
  const params = getQuery(event)

  try {
    const query = `/* cypher */
      OPTIONAL MATCH (p:Player) WHERE p.first_name || ' ' || p.last_name =~ '(?i).*' + $searchTerm + '.*'
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

      OPTIONAL MATCH (t:Tournament) WHERE t.name =~ '(?i).*' + $searchTerm + '.*'

      RETURN properties(t) AS result

      ORDER BY toLower(result.name)
      LIMIT 20
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    const results = records.map(record => {
      const result = record.get("result")

      if (!result) return null

      return searchResultsSchema.parse(result)
    })

    return {
      results: results.filter(Boolean) as SearchResultsType[],
      statusObjects
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: formatZodError(error)
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Error fetching search results for ${params.searchTerm}`,
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
