import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => countryMatchFormSchema.parse(body))

    let query = `/* cypher */
      // MATCH (e:Event {id: $event})<-[:ROUND_OF]-(r:Round:$($type) {round: $round})
      MATCH (t:Tie {id: $tie})-[:TIE_OF]->(r:Round)
      MERGE (m:Match:Main:$($type):BestOf3 {id: $id, match_no: $match_no})
      MERGE (m)-[:PLAYED]->(r)
      MERGE (m)-[:PLAYED]->(t)
      SET m += $match
    `

    if (params.t1) {
      query += `
        WITH m
        MATCH (f1:Entry {id: $t1})
        MERGE (s1:Main:$($type):T1:Score {id: $team1.id})
        SET s1 += $team1
        MERGE (f1)-[:SCORED]->(s1)
        MERGE (s1)-[:SCORED]->(m)
      `

      if (params.winner) {
        query +=
          params.winner === "t1"
            ? `
        SET s1:Winner
      `
            : `
        SET s1:Loser
      `
      }
    }

    if (params.team2) {
      query += `
        WITH m
        MATCH (f2:Entry {id: $t2})
        MERGE (s2:Main:$($type):T2:Score {id: $team2.id})
        SET s2 += $team2
        MERGE (f2)-[:SCORED]->(s2)
        MERGE (s2)-[:SCORED]->(m)
      `

      if (params.winner) {
        query +=
          params.winner === "t2"
            ? `
        SET s2:Winner
      `
            : `
        SET s2:Loser
      `
      }
    }

    if (params.umpire) {
      query += `
        WITH m
        MATCH (u:Umpire {id: $umpire})
        MERGE (u)-[:UMPIRED]->(m)
      `
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Match could not be created" })
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
