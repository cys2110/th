import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (:Tournament {id: $id})<-[:EDITION_OF]-
        (ed:Edition)<-[:EVENT_OF]-
        (e:Event)<-[:ROUND_OF]-
        (r:Round {round: 'Final'})<-[:PLAYED]-
        (:Match)<-[:SCORED]-
        (:Winner)<-[:SCORED]-
        (f:Entry)<-[:ENTERED]-
        (p:Player)-[:REPRESENTS]->
        (c:Country)
      MATCH (ed)-[:IN_YEAR]->(y:Year)
      OPTIONAL MATCH
        (p)-
          [z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->
        (c1:Country)
      WITH
        apoc.map.submap(p, ['id', 'first_name', 'last_name']) AS player,
        y,
        ed,
        coalesce(properties(c1), properties(c)) AS country,
        CASE
          WHEN f:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        CASE
          WHEN p.dob IS NULL THEN null
          ELSE duration.between(p.dob, coalesce(e.end_date, ed.end_date))
        END AS age,
        [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS tour
      ORDER BY age

      RETURN apoc.map.merge(
        player,
        {
          country: country,
          edId: ed.id,
          year: y.id,
          type: type,
          age: age,
          tour: tour
        }
      ) AS winner
    `,
    { id: int(id) }
  )

  const results = records.map(record => {
    const result = record.get("winner")
    return tournamentAgeSchema.parse(result)
  })

  return results
})
