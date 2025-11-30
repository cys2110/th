export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
      RETURN coalesce(e.start_date, ed.start_date) AS start_date, coalesce(e.end_date, ed.end_date) AS end_date
    `,
    { id: `${edId}-${tour}` }
  )

  const dates = records[0].toObject()

  return {
    start_date: neoDateToStringSchema.parse(dates.start_date),
    end_date: neoDateToStringSchema.parse(dates.end_date)
  }
})
