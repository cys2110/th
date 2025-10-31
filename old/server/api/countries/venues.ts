export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (c:Country {id: $id})<-[:LOCATED_IN]-(v:Venue)
      WITH *
      ORDER BY v.city, v.name
      RETURN
        CASE
          WHEN
            v IS NOT NULL
            THEN apoc.map.merge(properties(v), {country: properties(c)})
          ELSE null
        END AS venue

    `,
    { id }
  )

  const results = records.map(record => record.get("venue")).filter(Boolean)

  return results
})
