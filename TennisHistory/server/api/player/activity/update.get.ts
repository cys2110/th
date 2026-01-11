export default defineEventHandler(async event => {
  try {
    const { id } = getQuery<{ id: string }>(event)

    const { summary } = await useDriver().executeQuery(
      `/* cypher */
      CYPHER 25
      MATCH (r:Round) WHERE r.id STARTS WITH $id

      WITH r ORDER BY r.number DESC
      WITH COLLECT(r) AS rounds
      WITH rounds, head([x IN rounds WHERE x.number < 9]) AS max_round

      UNWIND rounds AS r

      MATCH (:Player)-[:ENTERED]->(f:Entry)-[:SCORED]->(:Loser)-[:SCORED]->(:Match)-[:PLAYED]->(r)

      // Set pm and points for non-winners who are non-qualifiers and non-lucky losers
      CALL (*) {
        WHEN f:Doubles THEN {
          WHEN f.status = 'Q' THEN {
            MATCH (r)-[:ROUND_OF]->(:Event)<-[:ROUND_OF]-(r1:Round:Doubles {round: 'Qualifier'})
            CALL (*) {
              // WTA Qualifiers - If lose in first round, only get qualifier points
              WHEN r:WTA AND r.number = max_round.number THEN {
                SET f.pm = r1.pm / 2, f.points = r1.points
              } ELSE {
                // Add on qualifier points
                SET f.pm = r.pm / 2, f.points = r.points + r1.points
              }
            }
          }
          WHEN f.status = 'LL' THEN {
            MATCH (f)-[:SCORED]->(:Loser)-[:SCORED]->(:Match)-[:PLAYED]->(r1:Round:Qualifying)
            CALL (*) {
              // WTA Lucky losers - If lose in first round, only get LL points
              WHEN r:WTA AND r.number = max_round.number THEN {
                SET f.pm = r1.pm / 2, f.points = r1.points
              } ELSE {
                // Add on LL points
                SET f.pm = r.pm / 2, f.points = r.points + r1.points
              }
            }
          }
          // ATP Wild cards - no points unless they win a match
          WHEN f.status = 'WC' AND r:ATP AND r.number = max_round.number THEN {
            SET f.pm = r.pm / 2, f.points = 0
          }
          // Byes - first round points if they lose first match
          WHEN NOT EXISTS (f)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(:Round) AND r.number < max_round.number THEN {
            SET f.pm = r.pm / 2, f.points = max_round.points
          }
          ELSE {
            SET f.pm = r.pm / 2, f.points = r.points
          }
        } ELSE {
          WHEN f.status = 'Q' THEN {
            MATCH (r)-[:ROUND_OF]->(:Event)<-[:ROUND_OF]-(r1:Round:Doubles {round: 'Qualifier'})
            CALL (*) {
              // WTA Qualifiers - If lose in first round, only get qualifier points
              WHEN r:WTA AND r.number = max_round.number THEN {
                SET f.pm = r1.pm, f.points = r1.points
              } ELSE {
                // Add on qualifier points
                SET f.pm = r.pm, f.points = r.points + r1.points
              }
            }
          }
          WHEN f.status = 'LL' THEN {
            MATCH (f)-[:SCORED]->(:Loser)-[:SCORED]->(:Match)-[:PLAYED]->(r1:Round:Qualifying)
            CALL (*) {
              // WTA Lucky losers - If lose in first round, only get LL points
              WHEN r:WTA AND r.number = max_round.number THEN {
                SET f.pm = r1.pm, f.points = r1.points
              } ELSE {
                // Add on LL points
                SET f.pm = r.pm, f.points = r.points + r1.points
              }
            }
          }
          // ATP Wild cards - no points unless they win a match
          WHEN f.status = 'WC' AND r:ATP AND r.number = max_round.number THEN {
            SET f.pm = r.pm, f.points = 0
          }
          // Byes - first round points if they lose first match
          WHEN NOT EXISTS (f)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(:Round) AND r.number < max_round.number THEN {
            SET f.pm = r.pm, f.points = max_round.points
          }
          ELSE {
            SET f.pm = r.pm, f.points = r.points
          }
        }
      }

      WITH r WHERE r.number = 1

      MATCH (:Player)-[:ENTERED]->(f:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(r)

      // Set pm and points for winners
      CALL (*) {
        WHEN f:Doubles THEN {
          MATCH (r)-[:ROUND_OF]->(e:Event)<-[:ROUND_OF]-(r1:Round:Doubles {round: 'Win'})
          CALL (f, e) {
            // Add in qualifier/LL points if applicable
            WHEN f.status = 'Q' THEN {
              MATCH (r2:Round:Doubles {round: 'Qualifier'})-[:ROUND_OF]->(e)
              RETURN r2.points AS addedPoints
            }
            WHEN f.status = 'LL' THEN {
              MATCH (f)-[:SCORED]->(:Loser)-[:SCORED]->(:Match)-[:PLAYED]->(r3:Round)
              RETURN r2.points AS addedPoints
            }
            ELSE RETURN 0 AS addedPoints
          }
          SET f.pm = r1.pm / 2, f.points = r1.points + addedPoints
        } ELSE {
          MATCH (r)-[:ROUND_OF]->(:Event)<-[:ROUND_OF]-(r1:Round:Singles {round: 'Win'})
          CALL (f, e) {
            // Add in qualifier/LL points if applicable
            WHEN f.status = 'Q' THEN {
              MATCH (r2:Round:Singles {round: 'Qualifier'})-[:ROUND_OF]->(e)
              RETURN r2.points AS addedPoints
            }
            WHEN f.status = 'LL' THEN {
              MATCH (f)-[:SCORED]->(:Loser)-[:SCORED]->(:Match)-[:PLAYED]->(r3:Round)
              RETURN r2.points AS addedPoints
            }
            ELSE RETURN 0 AS addedPoints
          }
          SET f.pm = r1.pm, f.points = r1.points + addedPoints
        }
      }
    `,
      { id }
    )

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Activity could not be updated" })
    } else {
      return { success: true }
    }
  } catch (error) {
    throw error
  }
})
