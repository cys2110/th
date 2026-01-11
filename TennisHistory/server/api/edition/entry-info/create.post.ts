import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => entryInfoFormSchema.parse(body))

    let query = `
      CYPHER 25
      MATCH (e:Event {id: $event})
    `

    switch (params.relationship) {
      case "Alternate":
      case "Qualifier":
      case "Wild Card":
      case "Lucky Loser":
        query += `
          MATCH (f:Entry {id: $id})
          CALL (*) {
            WHEN $draw = 'Main' THEN {
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
              ELSE {
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
        query += `
          MATCH (f:Entry {id: $id})
          CALL (*) {
            WHEN $draw = 'Main' THEN {
              WHEN $relationship = 'Default' THEN {
                MATCH (f)-[:SCORED]->(s:Loser)
                MERGE (f)-[t:DEFAULTED]->(e)
                SET t += $properties, s.incomplete = 'Def'
              }
              WHEN $relationship = 'Retirement' THEN {
                MATCH (f)-[:SCORED]->(s:Loser)
                MERGE (f)-[t:RETIRED]->(e)
                SET t += $properties, s.incomplete = 'R'
              }
              WHEN $relationship = 'Walkover' THEN {
                MATCH (f)-[:SCORED]->(s:Score)-[:SCORED]->(m) WHERE s:Loser OR (NOT s:Winner AND NOT s:Loser)
                MERGE (f)-[t:WALKOVER]->(e)
                SET t += $properties
                WITH s, m
                CALL (s, m) {
                  WHEN s:Loser THEN {
                    SET s.incomplete = 'WO', m.incomplete = 'WO'
                    REMOVE m:Best3, m:Best5
                  }
                  ELSE {
                    MATCH (s)-[:SCORED]->(m)<-[:SCORED]-(s1)
                    SET s:Loser, s1:Winner, s.incomplete = 'WO', m.incomplete = 'WO'
                    REMOVE m:Best3, m:Best5
                  }
                }
              }
            }
            ELSE {
              WHEN $relationship = 'Default' THEN {
                MATCH (f)-[:SCORED]->(s:Loser)
                MERGE (f)-[t:Q_DEFAULTED]->(e)
                SET t += $properties, s.incomplete = 'Def'
              }
              WHEN $relationship = 'Retirement' THEN {
                MATCH (f)-[:SCORED]->(s:Loser)
                MERGE (f)-[t:Q_RETIRED]->(e)
                SET t += $properties, s.incomplete = 'R'
              }
              WHEN $relationship = 'Walkover' THEN {
                MATCH (f)-[:SCORED]->(s:Score)-[:SCORED]->(m) WHERE s:Loser OR (NOT s:Winner AND NOT s:Loser)
                MERGE (f)-[t:Q_WALKOVER]->(e)
                SET t += $properties
                WITH s, m
                CALL (s, m) {
                  WHEN s:Loser THEN {
                    SET s.incomplete = 'WO', m.incomplete = 'WO'
                    REMOVE m:Best3
                  } ELSE {
                    MATCH (s)-[:SCORED]->(m)<-[:SCORED]-(s1)
                    SET s:Loser, s1:Winner, s.incomplete = 'WO', m.incomplete = 'WO'
                    REMOVE m:Best3, m:Best5
                  }
                }
              }
            }
          }
        `

        break
      case "Last Direct Acceptance":
        query += `
        MATCH (f:Entry {id: $id})
      `

        if (params.draw === "Main") {
          query += `
            MERGE (f)-[t:LDA]->(e)
          `
        } else {
          query += `
            MERGE (f)-[t:Q_LDA]->(e)
          `
        }

        query += `
          SET t += $properties
        `
        break
      case "Withdrawal":
        query += `
        MATCH (p1:Player {id: $player1})
      `

        if (params.player2) {
          query += `
            MATCH (p2:Player {id: $player2})
            MERGE (f:Entry:$($type) {id: $event || ' ' || $player1 || ' ' || $player2})
            MERGE (p1)-[:ENTERED]->(f)
            MERGE (p2)-[:ENTERED]->(f)
          `
        } else {
          query += `
            MERGE (f:Entry:$($type) {id: $event || ' ' || $player1})
            MERGE (p1)-[:ENTERED]->(f)
          `
        }

        if (params.draw === "Main") {
          query += `
            MERGE (f)-[t:WITHDREW]->(e)
            SET t += $properties
          `
        } else {
          query += `
            MERGE (f)-[t:Q_WITHDREW]->(e)
            SET t += $properties
          `
        }
        break
      default:
        throw createError({ statusCode: 400, statusMessage: "Invalid relationship type" })
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Entry info could not be created" })
    } else {
      return { success: true }
    }
  } catch (error) {
    const zodErr = error instanceof ZodError ? error : error instanceof Error && error.cause instanceof ZodError ? error.cause : null

    if (zodErr) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body",
        data: {
          validationErrors: zodErr.issues
        }
      })
    }

    throw error
  }
})
