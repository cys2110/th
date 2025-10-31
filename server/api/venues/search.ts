export default defineEventHandler(async event => {
  const { search } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (v:Venue)-[:LOCATED_IN]->(c:Country) WHERE v.name =~ '(?i).*'+ $search + '(?i).*'
      RETURN apoc.map.merge(properties(v), {country: properties(c)}) AS venue
      ORDER BY v.city, v.name
      LIMIT 40
    `,
    { search }
  )

  const results = records.map(r => {
    const venue = r.get("venue")
    return { value: venue.id, label: `${venue.name ? `${venue.name}, ${venue.city}` : venue.city}, ${venue.country.name}` }
  })

  return results
})
