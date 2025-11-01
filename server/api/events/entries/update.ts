import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    type: MatchType
    seed: string
    q_seed: string
    status: string
    q_status: string
    rank: string
    points: string
    pm: string
    event: string
  }

  const { id, type, seed, q_seed, status, q_status, rank, points, pm, event: eventId } = getQuery<QueryProps>(event)

  const formattedParams = {
    id,
    type,
    seed: seed ? int(seed) : null,
    q_seed: q_seed ? int(q_seed) : null,
    status: status || null,
    q_status: q_status || null,
    rank: rank ? int(rank) : null,
    points: points ? int(points) : null,
    pm: pm ? int(pm) : null,
    eventId
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (:Player {id: $id})-[t:ENTERED]->(f:Entry:$($type) WHERE f.id STARTS WITH $eventId)
    SET f.seed = $seed, f.q_seed = $q_seed, f.status = $status, f.q_status = $q_status, t.rank = $rank, f.points = $points, f.pm = $pm
    `,
    formattedParams
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Entry could not be updated" })
  } else {
    return { ok: true }
  }
})
