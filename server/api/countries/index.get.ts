export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (c:Country {id: $id})
    RETURN properties(c) AS country
    `,
    { id }
  )

  return countrySchema.parse(records[0].get("country"))
})
