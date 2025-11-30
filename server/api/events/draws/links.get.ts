export default defineEventHandler(async event => {
  interface QueryProps {
    edId: string
    tour: TourEnumType
  }

  const { edId, tour } = getQuery<QueryProps>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})-[:EVENT_OF]->(ed:Edition)
    WITH apoc.map.submap(e, ['s_link', 'd_link', 'qs_link', 'qd_link', 's_draw', 'd_draw', 'qs_draw', 'qd_draw'], null, false) AS event_links, apoc.map.submap(ed, ['draw_type', 'draw_link'], null, false) AS edition_links
    RETURN apoc.map.clean(apoc.map.mergeList([event_links, edition_links]), [], [null]) AS links
    `,
    { id: `${edId}-${tour}` }
  )

  const results = records[0].get("links")

  return drawLinksSchema.parse(results)
})
