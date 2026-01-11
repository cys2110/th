import { int } from "neo4j-driver"

export default defineEventHandler(async query => {
  try {
    const { edId } = getQuery<{ edId: string }>(query)

    const { records } = await useDriver().executeQuery(
      `/* cypher */
        MATCH (ed:Edition {id: $id})<-[:EVENT_OF]-(e:Event)<-[:ROUND_OF]-(r:Round)
        WITH
          r,
          e,
          ed,
          CASE
            WHEN r:Singles THEN 'Singles'
            ELSE 'Doubles'
          END AS type,
          [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
        ORDER BY type DESC, r.number
        WITH
          r,
          type,
          coalesce(e.currency, ed.currency) AS currency,
          tour
        RETURN
          apoc.map.clean(
            apoc.map.merge(properties(r), {
              currency: currency,
              type: type,
              tour: tour
            }),
            [],
            [null]
          ) AS round
        `,
      { id: int(edId) }
    )

    const results = records.map(record => {
      const round = record.get("round")

      return awardSchema.parse(round)
    })

    return results
  } catch (error) {
    throw error
  }
})
