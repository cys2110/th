export default defineEventHandler(async query => {
  const { searchTerm } = getQuery(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      OPTIONAL MATCH (n:Player) WHERE n.first_name || ' ' || n.last_name =~ '(?i).*' + $searchTerm + '(?i).*'
      OPTIONAL MATCH (n)-[:REPRESENTS]->(c:Country)
      RETURN apoc.map.merge(apoc.map.submap(n, ['id', 'first_name', 'last_name']), {country: properties(c), labels: [x IN labels(n) WHERE x IN ['Player', 'Umpire', 'Coach', 'Supervisor']]}) AS result
      ORDER BY result.last_name, result.first_name
      LIMIT 40

      UNION

      OPTIONAL MATCH (n:Tournament|Country) WHERE n.name =~ '(?i).*' + $searchTerm + '.*'
      RETURN apoc.map.merge(properties(n), {labels: [x IN labels(n) WHERE x IN ['Tournament', 'Country']]}) AS result
      ORDER BY result.name
      LIMIT 40
    `,
    { searchTerm }
  )

  const results = records.map(record => record.get("result"))

  return results
})
