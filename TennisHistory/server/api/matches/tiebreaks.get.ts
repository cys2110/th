export default defineEventHandler(async event => {
  try {
    const { id } = getQuery(event)

    const { summary } = await useDriver().executeQuery(
      `/* cypher */
      CYPHER 25
      MATCH (s1:T1)-[:SCORED]->(m:Match WHERE m.id STARTS WITH $id)<-[:SCORED]-(s2:T2)
      CALL (*) {
        WHEN s1.t1 IS NOT NULL AND s2.t1 IS NULL THEN {
          WITH s2, CASE WHEN s1.t1 < 5 THEN 7 ELSE s1.t1 + 2 END AS t1
          SET s2.t1 = t1
        }
      }
      CALL (*) {
        WHEN s1.t2 IS NOT NULL AND s2.t2 IS NULL THEN {
          WITH s2, CASE WHEN s1.t2 < 5 THEN 7 ELSE s1.t2 + 2 END AS t1
          SET s2.t2 = t1
        }
      }
      CALL (*) {
        WHEN s1.t3 IS NOT NULL AND s2.t3 IS NULL THEN {
          WITH s2, CASE WHEN s1.t3 < 5 THEN 7 ELSE s1.t3 + 2 END AS t1
          SET s2.t3 = t1
        }
      }
      CALL (*) {
        WHEN s2.t1 IS NOT NULL AND s1.t1 IS NULL THEN {
          WITH s1, CASE WHEN s2.t1 < 5 THEN 7 ELSE s2.t1 + 2 END AS t1
          SET s1.t1 = t1
        }
      }
      CALL (*) {
        WHEN s2.t2 IS NOT NULL AND s1.t2 IS NULL THEN {
          WITH s1, CASE WHEN s2.t2 < 5 THEN 7 ELSE s2.t2 + 2 END AS t1
          SET s1.t2 = t1
        }
      }
      CALL (*) {
        WHEN s2.t3 IS NOT NULL AND s1.t3 IS NULL THEN {
          WITH s1, CASE WHEN s2.t3 < 5 THEN 7 ELSE s2.t3 + 2 END AS t1
          SET s1.t3 = t1
        }
      }
      RETURN *
    `,
      { id }
    )

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Tiebreaks could not be updated" })
    } else {
      return { success: true }
    }
  } catch (error) {
    throw error
  }
})
