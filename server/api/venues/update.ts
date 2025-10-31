export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    name: string
    city: string
    country: string
  }

  const { id, name, city, country } = getQuery<QueryProps>(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH (v:Venue {id: $id})
      SET v.name = $name, v.city = $city
      CALL (v) {
          MATCH (c:Country {id: $country})
          OPTIONAL MATCH (v)-[z:LOCATED_IN]->(c1:Country)
          CALL (*) {
            WHEN c1.id <> c.id THEN DELETE z
            ELSE MERGE (v)-[:LOCATED_IN]->(c)
        }
      }
    `,
    {
      id,
      name: name || null,
      city: city,
      country: country
    }
  )

  console.log(
    `Notifications for venue update: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Error updating venue"
    })
  } else {
    return { ok: true }
  }
})
