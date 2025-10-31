import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    event: string
    draw: DrawType
    type: MatchType
    seed: string
    rank: string
    team: string
  }

  const { event: eventId, draw, type, seed, rank, team } = getQuery<QueryProps>(event)

  const formattedParams = {
    eventId,
    type,
    draw,
    seed: seed ? int(seed) : null,
    rank: rank ? int(rank) : null,
    teamId: team
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (e:Event {id: $eventId})
    MATCH (f:Entry:$($type) {id: $teamId})
    CALL (*) {
      WHEN $draw = 'Main' THEN {
        MERGE (f)-[v:SEEDED]->(e)
        SET f.seed = $seed, v.rank = $rank
      }
      ELSE {
        MERGE (f)-[v:Q_SEEDED]->(e)
        SET f.q_seed = $seed, v.rank = $rank
      }
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
