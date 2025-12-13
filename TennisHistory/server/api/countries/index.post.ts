export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => querySchema.parse(body))

  const { records: countRecords } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (c:Country)
      WHERE
        (SIZE($continents) = 0 OR c.continent IN $continents) AND
        (SIZE($countries) = 0 OR c.id IN $countries)
      RETURN COUNT(c) AS count
    `,
    params
  )

  const count: number = countRecords[0].get("count").toInt() || 0

  if (count === 0) {
    return {
      count: 0,
      countries: []
    }
  }

  let query = `/* cypher */
    MATCH (c:Country)
      WHERE
        (SIZE($continents) = 0 OR c.continent IN $continents) AND
        (SIZE($countries) = 0 OR c.id IN $countries)
    RETURN properties(c) AS country
    ORDER BY
  `

  if (params.sortField.length) {
    query += params.sortField
      .map(({ field, direction }: { field: string; direction: "ASC" | "DESC" }) => {
        const keyName = field === "name" ? "toLower(c.name)" : "toLower(c.continent)"
        return keyName + " " + direction
      })
      .join(", ")

    if (!params.sortField.some(({ field }) => field === "name")) {
      query += `, toLower(c.name)`
    }
  } else {
    query += `toLower(c.name)`
  }

  query += `/* cypher */
    SKIP $skip
    LIMIT $offset
  `

  const { records } = await useDriver().executeQuery(query, params)

  const results = records.map(record => {
    const country = record.get("country")

    return countrySchema.parse(country)
  })

  return {
    count,
    countries: results
  }
})
