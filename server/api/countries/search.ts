export default defineEventHandler(async event => {
  const { search } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (t:Country) WHERE t.name =~ '(?i).*' + $search + '(?i).*'
      RETURN { value: t.id, label: t.name } AS country
      ORDER BY toLower(t.name)
      LIMIT 40
    `,
    {
      search
    }
  )

  const results = records.map(record => record.get("country"))

  return results
})
