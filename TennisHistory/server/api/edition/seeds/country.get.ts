export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery(event)

    const query = `/* cypher */
      MATCH (c:Country)-[:ENTERED]->(cf:CountryEntry) WHERE cf.id STARTS WITH $edId AND cf.seed IS NOT NULL

      RETURN apoc.map.merge(
        properties(c),
        { seed: cf.seed }
      ) AS seed
  `

    const { records } = await useDriver().executeQuery(query, { edId })

    const results = records.map(r => {
      const seed = r.get("seed")
      return countryTeamSchema.parse(seed)
    })

    return results
  } catch (error) {
    throw error
  }
})
