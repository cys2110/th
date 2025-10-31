import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    event: string
    type: MatchType
    seed: string
    q_seed: string
    status: string
    q_status: string
    rank: string
    player1: string
    player2: string
    rank2: string
    points: string
    pm: string
  }

  const { event: eventId, type, seed, q_seed, status, q_status, rank, player1, player2, rank2, points, pm } = getQuery<QueryProps>(event)

  const formattedParams = {
    eventId,
    type,
    seed: seed ? int(seed) : null,
    q_seed: q_seed ? int(q_seed) : null,
    status: status || null,
    q_status: q_status || null,
    rank: rank ? int(rank) : null,
    player1Id: player1,
    player2Id: player2 || null,
    rank2: rank2 ? int(rank2) : null,
    points: points ? int(points) : null,
    pm: pm ? int(pm) : null
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (p1:Player {id: $player1Id})
    MERGE (f:Entry:$($type) {id: $eventId || ' ' || $player1Id})
    MERGE (p1)-[t1:ENTERED]->(f)
    SET f.seed = $seed, f.q_seed = $q_seed, f.status = $status, f.q_status = $q_status, t.rank = $rank, f.points = $points, f.pm = $pm
    CALL (f) {
      WHEN $player2Id IS NOT NULL THEN {
        MATCH (p2:Player {id: $player2Id})
        MERGE (p2)-[t2:ENTERED]->(f)
        SET t2.rank = $rank2, f.id = f.id || ' ' || $player2Id
      }
    }
    `,
    formattedParams
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Entry could not be created" })
  } else {
    return { ok: true }
  }
})
