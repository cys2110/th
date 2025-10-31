import { int } from "neo4j-driver"

export default defineEventHandler(async query => {
  const { edId, tour, mid } = getQuery(query)

  const matchNoParams = destructureMid(mid as string)

  const params = {
    ...matchNoParams,
    match_no: int(matchNoParams.match_no),
    id: `${edId}-${tour}`
  }

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (m:Match:$($draw):$($type) {match_no: $match_no})-[:PLAYED]->
        (r:Round)-[:ROUND_OF]->
        (:Event {id: $id})-[:EVENT_OF]->(:Edition)-[:EDITION_OF]->
        (t:Tournament)
      MATCH
        (p1:Player)-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (T1)-[:SCORED]->
        (m)<-[:SCORED]-
        (:T2)<-[:SCORED]-
        (:Entry)<-[:ENTERED]-
        (p2:Player)
      WITH
        r.round AS round,
        COLLECT(DISTINCT p1) AS player1,
        COLLECT(DISTINCT p2) AS player2,
        CASE
          WHEN $type = 'Singles' THEN true
          ELSE false
        END AS isSingles,
        t
      RETURN apoc.map.merge(properties(t), {
        round: round,
          player1:
            CASE
              WHEN isSingles THEN player1[0].first_name || ' ' || player1[0].last_name
              ELSE
                player1[0].first_name ||
                ' ' ||
                player1[0].last_name ||
                ' / ' ||
                player1[1].first_name ||
                ' ' ||
                player1[1].last_name
            END,
          player2:
            CASE
              WHEN isSingles THEN player2[0].first_name || ' ' || player2[0].last_name
              ELSE
                player2[0].first_name ||
                ' ' ||
                player2[0].last_name ||
                ' / ' ||
                player2[1].first_name ||
                ' ' ||
                player2[1].last_name
            END}) AS match
    `,
    params
  )

  const results = records[0].get("match")

  return results
})
