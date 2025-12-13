export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
      RETURN coalesce(e.currency, ed.currency) AS currency
    `,
    { id: `${edId}-${tour}` }
  )

  return records[0]?.get("currency") || "USD"
})
