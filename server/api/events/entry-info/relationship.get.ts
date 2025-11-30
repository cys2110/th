export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (e:Event {id: $id})
      OPTIONAL MATCH (f:Entry {status: 'Alt'}) WHERE f.id STARTS WITH e.id
      OPTIONAL MATCH (f1:Entry {q_status: 'Alt'}) WHERE f1.id STARTS WITH e.id
      SET f.status = 'AL', f1.q_status = 'AL'

      WITH e
      CALL (*) {
        WITH [['Q', 'QUALIFIED'], ['WC', 'WILD_CARD'], ['LL', 'LUCKY_LOSER'], ['AL', 'ALTERNATE']] AS statuses
        UNWIND statuses AS status
        OPTIONAL MATCH (f1:Entry {status: status[0]}) WHERE f1.id STARTS WITH e.id
        WITH e, f1, status
        WHERE f1 IS NOT NULL
        MERGE (f1)-[z:$(status[1])]->(e)
      }
      CALL (*) {
        WITH [['WC', 'Q_WILD_CARD'], ['AL', 'Q_ALTERNATE']] AS statuses
        UNWIND statuses AS status
        OPTIONAL MATCH (f1:Entry {q_status: status[0]}) WHERE f1.id STARTS WITH e.id
        WITH e, f1, status
        WHERE f1 IS NOT NULL
        MERGE (f1)-[z:$(status[1])]->(e)
      }
      RETURN *
    `,
    { id }
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Entry info could not be updated" })
  } else {
    return { ok: true }
  }
})
