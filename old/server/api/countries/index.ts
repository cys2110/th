export default defineEventHandler(async event => {
  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (c:Country WHERE c.name <> "" AND c.id IS NOT NULL)
    WITH *
    ORDER BY toLower(c.name)
    RETURN properties(c) AS country
    `
  )

  const results = records.map(record => record.get("country"))

  return results
})
