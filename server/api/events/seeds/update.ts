import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    draw: DrawType
    type: MatchType
    seed: string
    rank: string
    team: string
  }

  const { id, draw, type, seed, rank, team } = getQuery<QueryProps>(event)

  const formattedParams = {
    type,
    draw,
    seed: seed ? int(seed) : null,
    rank: rank ? int(rank) : null,
    teamId: team
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    WHEN $draw = 'Main' THEN {
      MATCH (f:Entry:$($type) {id: $teamId})-[v:SEEDED]->(e:Event)
      SET f.seed = $seed, v.rank = $rank
    } ELSE {
      MATCH (f:Entry:$($type) {id: $teamId})-[v:Q_SEEDED]->(e:Event)
      SET f.q_seed = $seed, v.rank = $rank
    }
    `,
    formattedParams
  )

  if (summary.counters.updates().nodesCreated === 0 && summary.counters.updates().propertiesSet === 0) {
    throw createError({ statusCode: 400, statusMessage: "Seed could not be created" })
  } else {
    return { ok: true }
  }
})
