import { int } from "neo4j-driver"

export default defineEventHandler(async query => {
  const { edId, tour, matchNo, draw, type } = getQuery(query)

  const params = {
    draw,
    type,
    match_no: int(matchNo as string),
    id: `${edId}-${tour}`
  }

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (:Match:$($draw):$($type) {match_no: $match_no})-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (:Event {id: $id})-[:EVENT_OF]->(:Edition)-[:EDITION_OF]->
        (t:Tournament)
      WITH
        r.round AS round,
        t
      RETURN apoc.map.merge(properties(t),
        { round: round }
      ) AS match
    `,
    params
  )

  const results = records[0].get("match")

  return results
})
