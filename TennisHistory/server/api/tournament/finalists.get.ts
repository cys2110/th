import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { id } = getQuery<{ id: string }>(event)

    const { records, summary } = await useDriver().executeQuery(
      `/* cypher */
      MATCH
        (:Tournament {id: $id})<-[:EDITION_OF]-
        (ed:Edition)<-[:EVENT_OF]-
        (e:Event)<-[:ROUND_OF]-
        (:Round {round: 'Final'})<-[:PLAYED]-
        (:Match)<-[:SCORED]-
        (s:Score)<-[:SCORED]-
        (:Entry)<-[:ENTERED]-
        (p:Player)-[:REPRESENTS]->
        (c:Country)
      MATCH (ed)-[:IN_YEAR]->(y:Year)

      WITH
        p,
        ed.id AS edId,
        s,
        c,
        y.id AS year,
        coalesce(e.start_date, ed.start_date) AS start_date,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour,
        CASE
          WHEN s:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type
      OPTIONAL MATCH
        (p)-
          [z:REPRESENTED WHERE z.start_date <= start_date AND z.end_date > start_date]->
        (c1:Country)
      WITH
        p,
        year,
        tour,
        type,
        edId,
        coalesce(properties(c1), properties(c)) AS country,
        CASE
          WHEN s:Winner THEN true
          ELSE false
        END AS title
      RETURN
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name']),
          {
            country: country,
            tour: tour,
            type: type,
            year: year,
            edId: edId,
            title: title
          }
        ) AS player
    `,
      { id: int(id) }
    )

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: `Tournament with ID ${id} could not be found.`
      })
    }

    const results = records.map(record => {
      const result = record.get("player")
      return tournamentFinalistsSchema.parse(result)
    })

    return results
  } catch (error) {
    throw error
  }
})
