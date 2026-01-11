import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery<{ edId: string }>(event)

    const { records } = await useDriver().executeQuery(
      `/* cypher */
        MATCH (e:Event)-[:EVENT_OF]->(ed:Edition {id: $id})

        WITH apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(e, ['s_link', 'd_link', 'qs_link', 'qd_link', 's_draw', 'd_draw', 'qs_draw', 'qd_draw'], null, false),
            { tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] }
          ), [], [null]
        ) AS event_link, ed

        WITH COLLECT(event_link) AS event_links, ed

        RETURN apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(ed, ['draw_type', 'draw_link'], null, false),
            { events: event_links}
          ), [], [null]
        ) AS links
        `,
      { id: int(edId) }
    )

    const results = records[0].get("links")

    return editionDrawLinksSchema.parse(results)
  } catch (error) {
    throw error
  }
})
