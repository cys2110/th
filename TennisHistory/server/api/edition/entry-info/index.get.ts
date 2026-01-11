import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery<{ edId: string }>(event)

    const { records } = await useDriver().executeQuery(
      `/* cypher */
    MATCH (f:Entry)-[t]->(e:Event)-[:EVENT_OF]->(ed:Edition {id: $id}) WHERE NOT type(t) IN ['SEEDED', 'Q_SEEDED']

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
      team,
      [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
    RETURN apoc.map.clean(
      apoc.map.mergeList([
        properties,
        entry,
        {
          team: team,
          type: type,
          relationship: relationship,
          tour: tour
        }
      ]),
      [],
      [null]
    ) AS result
    `,
      { id: int(edId) }
    )

    const results = records.map(record => {
      const result = record.get("result")

      return entryInfoSchema.parse(result)
    })

    return results
  } catch (error) {
    throw error
  }
})
