export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (r:Round)-[:ROUND_OF]->(:Event {id: $id})
      WHERE NOT r.round IN ['Win', 'Qualifier', "Participation", "Alternate"]
      WITH r
      ORDER BY r.number DESC
      RETURN DISTINCT r.round AS round
    `,
    { id: `${edId}-${tour}` }
  )

  const rounds = records.map(r => r.get("round"))

  return rounds as string[]
})
