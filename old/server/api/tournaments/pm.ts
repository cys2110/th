export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (:Tournament {id: $id})<-[:EDITION_OF]-(e:Event)-[:IN_YEAR]->(y:Year)
      MATCH (e)<-[:ROUND_OF]-(r:Round)
      WITH
        e,
        r,
        y,
        CASE
          WHEN r:ATP THEN 'ATP'
          WHEN r:WTA THEN 'WTA'
          WHEN r:Men THEN 'ITF (M)'
          ELSE 'ITF (W)'
        END AS tour,
        CASE
          WHEN r:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type
      RETURN
        apoc.map.merge(
          properties(r),
          {
            tour: tour,
            type: type,
            currency:
              CASE
                WHEN tour = 'ATP' THEN e.atp_currency
                WHEN tour = 'WTA' THEN e.wta_currency
                WHEN tour = 'ITF (W)' THEN e.women_currency
                ELSE e.men_currency
              END,
            year: y.id,
            id: e.id
          }
        ) AS round
      ORDER BY y.id DESC, tour, r.number
    `,
    { id: Number(id) }
  )

  const results = records.map(record => record.get("round"))

  for (const round of results) {
    const numberKeys = ["pm", "number", "year", "points", "id"]

    for (const key of numberKeys) {
      if (round[key]) round[key] = round[key].toInt()
    }
  }

  return results
})
