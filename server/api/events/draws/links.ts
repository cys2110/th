export default defineEventHandler(async event => {
  interface QueryProps {
    edId: string
    tour: keyof typeof TourEnum
  }

  const { edId, tour } = getQuery<QueryProps>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})
    RETURN apoc.map.submap(e, ['s_link', 'd_link', 'qs_link', 'qd_link', 's_draw', 'd_draw', 'qs_draw', 'qd_draw'], null, false) AS links
    `,
    { id: `${edId}-${tour}` }
  )

  const results = records[0].get("links")

  return results
})
