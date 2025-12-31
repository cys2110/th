/**
 * @description API route to fetch all countries
 */

export default defineEventHandler(async event => {
  let query = `/* cypher */
    MATCH (c:Country)
    RETURN properties(c) AS country
    ORDER BY toLower(c.name)
  `

  const { records } = await useDriver().executeQuery(query)

  const results = records.map(record => {
    const country = record.get("country")
    return countrySchema.parse(country)
  })

  return results
})
