export default defineEventHandler(async event => {
  const { searchTerm } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (n:Player) WHERE n.first_name || ' ' || n.last_name =~ '(?i).*' + $searchTerm + '(?i).*'
      OPTIONAL MATCH (n)-[:REPRESENTS]->(c:Country)
      RETURN apoc.map.merge(apoc.map.submap(n, ['id', 'first_name', 'last_name']), {country: properties(c), labels: [x IN labels(n) WHERE x IN ['Player', 'Umpire', 'Coach', 'Supervisor']]}) AS result
      ORDER BY result.last_name, result.first_name
      LIMIT 20

      UNION

      OPTIONAL MATCH (n:Tournament|Country) WHERE n.name =~ '(?i).*' + $searchTerm + '(?i).*'
      RETURN apoc.map.merge(properties(n), {labels: [x IN labels(n) WHERE x IN ['Tournament', 'Country']]}) AS result
      ORDER BY result.name
      LIMIT 20
    `,
    { searchTerm }
  )

  const results = records.map(record => record.get("result")).filter(record => record.labels?.length > 0)

  return results
})
