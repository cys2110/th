export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  let query = `/* cypher */
    MATCH (c:Country {id: $id})
    RETURN properties(c) AS country
  `

  const { records } = await useDriver().executeQuery(query, { id })

  return countrySchema.parse(records[0].get("country"))
})
