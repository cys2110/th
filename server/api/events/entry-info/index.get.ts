export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    OPTIONAL MATCH (f:Entry)-[t]->(e:Event {id: $id})-[:EVENT_OF]->(ed:Edition) WHERE NOT type(t) IN ['SEEDED', 'Q_SEEDED']

    CALL (f, e, ed) {
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[:ENTERED]->(f)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      WITH p, coalesce(properties(c), properties(c1)) AS country
      RETURN COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), { country: country })) AS team
    }
    WITH t,
      CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END AS type,
      TYPE(t) AS relationship,
      properties(t) AS properties,
      properties(f) AS entry,
      team
    RETURN CASE WHEN t IS NULL THEN NULL ELSE apoc.map.mergeList([
      properties,
      entry,
      {
        team: team,
        type: type,
        relationship: relationship
      }
    ]) END AS result
    `,
    { id: `${edId}-${tour}` }
  )

  const results = records.map(record => {
    const result = record.get("result")
    if (!result) return null

    return entryInfoSchema.parse(result)
  })

  return results.filter(Boolean) as EntryInfoType[]
})
