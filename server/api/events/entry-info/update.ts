import { int, Integer } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    relationship: string
    event: string
    draw: DrawType
    type: MatchType
    rank: string
    reason: string
    teammate: string
    entry: string
  }

  const { relationship, event: eventId, draw, type, rank, reason, teammate, entry } = getQuery<QueryProps>(event)

  let query
  const formattedParams: Record<string, any> = {
    relationship,
    eventId,
    draw,
    type,
    entry
  }

  switch (relationship) {
    case "Default":
    case "Retirement":
    case "Walkover":
      formattedParams["reason"] = reason
      formattedParams["teammate"] = teammate
      query = `/* cypher */
        CYPHER 25
        CASE
          WHEN $draw = 'Main' AND $relationship = 'Default' THEN 'DEFAULTED'
          WHEN $draw = 'Main' AND $relationship = 'Retirement' THEN 'RETIRED'
          WHEN $draw = 'Main' AND $relationship = 'Walkover' THEN 'WALKOVER'
          WHEN $relationship = 'Default' THEN 'Q_DEFAULTED'
          WHEN $relationship = 'Retirement' THEN 'Q_RETIRED'
          WHEN $relationship = 'Walkover' THEN 'Q_WALKOVER'
        END AS relationType
        MATCH (f:Entry:$($type) {id: $entry})-[t:$(relationType)]->(e:Event {id: $eventId})
        SET t.reason = $reason, t.teammate = $teammate
      `
      break
    case "Last Direct Acceptance":
      formattedParams["rank"] = int(rank)
      query = `/* cypher */
        CYPHER 25
        MATCH (f:Entry:$($type) {id: $entry})-[t:LDA|Q_LDA]->(e:Event {id: $eventId})
        SET t.rank = $rank
      `
      break
    case "Withdrawal":
      formattedParams["reason"] = reason
      formattedParams["teammate"] = teammate
      query = `/* cypher */
        CYPHER 25
        WITH CASE WHEN $draw = 'Main' THEN 'WITHDREW' ELSE 'Q_WITHDREW' END AS relationType
        MATCH (f:Entry:$($type) {id: $entry})-[t:$(relationType)]->(e:Event {id: $eventId})
        SET t.reason = $reason, t.teammate = $teammate
      `
      break
    default:
      break
  }

  const { summary } = await useDriver().executeQuery(query!)

  if (summary.counters.updates().nodesCreated === 0) {
    throw createError({ statusCode: 400, statusMessage: "Event could not be created" })
  } else {
    return { ok: true }
  }
})
