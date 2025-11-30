export default defineEventHandler(async query => {
  const { edId, tour } = getQuery(query)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (ed:Edition)<-[:EVENT_OF]-(e:Event {id: $id})<-[:ROUND_OF]-(r:Round)
    WITH
      r,
      e,
      ed,
      CASE
        WHEN r:Singles THEN 'Singles'
        ELSE 'Doubles'
      END AS type
    ORDER BY type DESC, r.number
    WITH r, type, coalesce(e.currency, ed.currency) AS currency
    RETURN
      apoc.map.merge(properties(r), {currency: currency, type: type}) AS round
    `,
    { id: `${edId}-${tour}` }
  )

  const results = records.map(record => {
    const round = record.get("round")

    return awardSchema.parse(round)
  })

  return results
})
