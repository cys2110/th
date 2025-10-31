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
  }

  const { id, type, seed, q_seed, status, q_status, rank } = getQuery<QueryProps>(event)

  const formattedParams = {
    id,
    type,
    seed: seed ? int(seed) : null,
    q_seed: q_seed ? int(q_seed) : null,
    status: status || null,
    q_status: q_status || null,
    rank: rank ? int(rank) : null
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (:Player)-[t:ENTERED]->(f:Entry {id: $id})
    SET f.seed = $seed, f.q_seed = $q_seed, f.status = $status, f.q_status = $q_status, t.rank = $rank
    `,
    formattedParams
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Entry could not be updated" })
  } else {
    return { ok: true }
  }
})
