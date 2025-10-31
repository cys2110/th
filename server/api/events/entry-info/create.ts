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
    players: string[] | string
  }

  const { relationship, event: eventId, draw, type, rank, reason, teammate, entry, players } = getQuery<QueryProps>(event)

  let query
  const formattedParams: Record<string, any> = {
    relationship,
    eventId,
    draw,
    type,
    entry
  }

  switch (relationship) {
    case "Alternate":
    case "Qualifier":
    case "Wild Card":
    case "Lucky Loser":
      query = `/* cypher */
        CYPHER 25
        MATCH (f:Entry:$($type) {id: $entry})
        MATCH (e:Event {id: $eventId})
        CALL (*) {
          WHEN $draw = 'Main' {
            WHEN $relationship = 'Alternate' THEN {
              MERGE (f)-[:ALTERNATE]->(e)
              SET f.status = 'AL'
            }
            WHEN $relationship = 'Qualifier' THEN {
              MERGE (f)-[:QUALIFIED]->(e)
              SET f.status = 'Q'
            }
            WHEN $relationship = 'Wild Card' THEN {
              MERGE (f)-[:WILD_CARD]->(e)
              SET f.status = 'WC'
            }
            WHEN $relationship = 'Lucky Loser' THEN {
              MERGE (f)-[:LUCKY_LOSER]->(e)
              SET f.status = 'LL'
            }
          }
          ELSE {
            WHEN $relationship = 'Alternate' THEN {
              MERGE (f)-[:Q_ALTERNATE]->(e)
              SET f.q_status = 'AL'
            }
            WHEN $relationship = 'Wild Card' THEN {
              MERGE (f)-[:Q_WILD_CARD]->(e)
              SET f.q_status = 'WC'
            }
          }
        }
      `
      break
    case "Default":
    case "Retirement":
    case "Walkover":
      formattedParams["reason"] = reason
      formattedParams["teammate"] = teammate
      query = `/* cypher */
        CYPHER 25
        MATCH (f:Entry:$($type) {id: $entry})-[:SCORED]->(s:Score) WHERE s:Loser OR (NOT s:Loser AND NOT s:Winner)
        MATCH (e:Event {id: $eventId})
        CALL (*) {
          WHEN $draw = 'Main' THEN {
            WHEN $relationship = 'Default' THEN {
              MERGE (f)-[:DEFAULTED {reason: $reason, teammate: $teammate}]->(e)
              SET s.incomplete = 'Def'
            }
            WHEN $relationship = 'Retirement' THEN {
              MERGE (f)-[:RETIRED {reason: $reason, teammate: $teammate}]->(e)
              SET s.incomplete = 'R'
            }
            WHEN $relationship = 'Walkover' THEN {
              MATCH (s)-[:SCORED]->(m:Match)<-[:SCORED]-(w:Score)
              MERGE (f)-[:WALKOVER {reason: $reason, teammate: $teammate}]->(e)
              SET s:Loser, w:Winner, s.incomplete = 'WO', m.incomplete = 'WO'
              REMOVE m:BestOf3, m:BestOf5
            }
          }
          ELSE {
            WHEN $relationship = 'Retirement' THEN {
              MERGE (f)-[:Q_RETIRED {reason: $reason, teammate: $teammate}]->(e)
              SET s.incomplete = 'R'
            }
            WHEN $relationship = 'Walkover' THEN {
              MATCH (s)-[:SCORED]->(m:Match)<-[:SCORED]-(w:Score)
              MERGE (f)-[:Q_WALKOVER {reason: $reason, teammate: $teammate}]->(e)
              SET s:Loser, w:Winner, s.incomplete = 'WO', m.incomplete = 'WO'
              REMOVE m:BestOf3, m:BestOf5
            }
            WHEN $relationship = 'Default' THEN {
              MERGE (f)-[:Q_DEFAULTED {reason: $reason, teammate: $teammate}]->(e)
              SET s.incomplete = 'Def'
            }
          }
        }
      `
      break
    case "Last Direct Acceptance":
      formattedParams["rank"] = int(rank)
      query = `/* cypher */
        CYPHER 25
        MATCH (f:Entry:$($type) {id: $entry})
        MATCH (e:Event {id: $eventId})
        CALL (*) {
          WHEN $draw = 'Main' THEN MERGE (f)-[:LDA {rank: $rank}]->(e)
          ELSE MERGE (f)-[:Q_LDA {rank: $rank}]->(e)
        }
      `
      break
    case "Withdrawal":
      formattedParams["player1"] = Array.isArray(players) ? (players[0] as string) : (players as string)
      formattedParams["player2"] = Array.isArray(players) && players.length > 1 ? (players[1] as string) : null
      formattedParams["reason"] = reason
      formattedParams["teammate"] = teammate
      formattedParams["entryId"] = `${eventId} ${Array.isArray(players) ? players.join(" ") : players}`
      query = `/* cypher */
        CYPHER 25
        MATCH (p1:Player {id: $player1})
        MATCH (e:Event {id: $eventId})
        MERGE (f:Entry:$($type) {id: $entryId})
        MERGE (p1)-[:ENTERED]->(f)
        CALL (f) {
          WHEN $player2 IS NOT NULL THEN {
            MATCH (p2:Player {id: $player2})
            MERGE (p2)-[:ENTERED]->(f)
          }
        }
        CALL (*) {
          WHEN $draw = 'Main' THEN MERGE (f)-[:WITHDREW {reason: $reason, teammate: $teammate}]->(e)
          ELSE MERGE (f)-[:Q_WITHDREW {reason: $reason, teammate: $teammate}]->(e)
        }
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
