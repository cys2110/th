export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH (p:Player)-[:ENTERED]->(f:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(:Match)-[:PLAYED]->(r:Round) WHERE f.id STARTS WITH $eid
      CALL (*) {
        WHEN f:Doubles THEN {
          WHEN s:Winner AND r.round = 'Final' THEN {
            MATCH (r1:Round:Doubles {id: $id || ' W'})
            SET f.pm = r1.pm / 2, f.points = r1.points
          }
          WHEN s:Loser THEN {
            SET f.pm = r.pm / 2, f.points = r.points
          }
        } ELSE {
          OPTIONAL MATCH (qr:Round:Singles {id: $id || ' Q'})
          OPTIONAL MATCH (q3:Round {id: $id || ' Q3'})
          OPTIONAL MATCH (q2:Round {id: $id || ' Q2'})
          CALL (*) {
            WHEN s:Winner AND r.round = 'Final' THEN {
              MATCH (r1:Round:Singles {id: $id || ' W'})
              WITH f, CASE WHEN f.status = 'Q' THEN r1.points + coalesce(qr.points, 0) WHEN f.status = 'LL' THEN r1.points + coalesce(q3.points, q2.points, 0) ELSE r1.points END AS points, r1.pm AS pm
              SET f.pm = pm, f.points = points
            }
            WHEN s:Loser THEN {
              WITH f, CASE WHEN f.status = 'Q' THEN r.points + coalesce(qr.points, 0) WHEN f.status = 'LL' THEN r1.points + coalesce(q3.points, q2.points, 0) ELSE r.points END AS points, r.pm AS pm
              SET f.pm = pm, f.points = points
            }
          }
        }
      }
    `,
    { id }
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Activity could not be updated" })
  } else {
    return { ok: true }
  }
})
