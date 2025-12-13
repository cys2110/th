import { int } from "neo4j-driver"

export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (:Tournament {id: $id})<-[:EDITION_OF]-
      (ed:Edition)<-[:EVENT_OF]-
      (e:Event)<-[:ROUND_OF]-(r:Round)
      MATCH (ed)-[:IN_YEAR]->(y:Year)

      WITH
        ed,
        r,
        y,
        e,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour,
        CASE
          WHEN r:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type
      RETURN
        apoc.map.merge(
          properties(r),
          {
            tour: tour,
            type: type,
            currency: coalesce(e.currency, ed.currency),
            year: y.id,
            id: ed.id
          }
        ) AS round
      ORDER BY y.id DESC, tour, r.number
    `,
    { id: int(id) }
  )

  const results = records.map(record => {
    const result = record.get("round")

    return tournamentPmSchema.parse(result)
  })

  return results
})
