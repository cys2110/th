export default defineEventHandler(async event => {
  interface QueryProps {
    name: string
    city: string
    country: string
  }

  const { name, city, country } = getQuery<QueryProps>(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (c:Country {id: $country})
      MERGE (v:Venue {city: $city})
      ON CREATE SET v.id = CASE
        WHEN $name IS NULL THEN $city
        WHEN $name CONTAINS v.city THEN $name
        ELSE $name || ', ' || $city
      END
      MERGE (v)-[:LOCATED_IN]->(c)
      SET v.name = $name
      RETURN v
    `,
    {
      name,
      city,
      country
    }
  )

  console.log(
    `Notifications for venue creation: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Error creating venue"
    })
  } else {
    return { ok: true }
  }
})
