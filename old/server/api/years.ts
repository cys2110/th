export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH (y:Year {id: $id})
      OPTIONAL MATCH (t:Tournament)-[t1:ESTABLISHED|ABOLISHED]->(y)
      WITH *
      ORDER BY t.name
      CALL (*) {
        WHEN t IS NOT NULL THEN {
          RETURN apoc.map.merge(properties(t), {type: type(t1)}) AS result }
        ELSE {
          RETURN null AS result }
      }
      RETURN DISTINCT result
        UNION
      MATCH (y:Year {id: $id})
      OPTIONAL MATCH (c:Country)<-[:REPRESENTS]-(p:Player)
      WHERE
        p.dob.year = y.id OR
        p.dod.year = y.id OR
        p.hof = y.id OR
        (p)-[:TURNED_PRO|RETIRED]->(y)
      WITH *
      ORDER BY p.last_name
      CALL (*) {
        WHEN p IS NOT NULL THEN {
          OPTIONAL MATCH (p)-[p1:TURNED_PRO|RETIRED]->(y)
          RETURN
            apoc.map.merge(
              apoc.map.submap(p, ['id', 'first_name', 'last_name']),
              {
                country: properties(c),
                type:
                  CASE
                    WHEN p1 IS NOT NULL THEN type(p1)
                    WHEN p.dob.year = y.id THEN 'born'
                    WHEN p.dod.year = y.id THEN 'Died'
                    ELSE 'Hall of Fame Induction'
                  END
              }
            ) AS result }
        ELSE {
          RETURN null AS result }
      }
      RETURN DISTINCT result
    `,
    { id: Number(id) }
  )

  return records.map(record => record.get("result")).filter(Boolean)
})
