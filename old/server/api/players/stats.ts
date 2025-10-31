export default defineEventHandler(async event => {
  const { id } = getQuery<{ id: string }>(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH
        (p:Player {id: $id})-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (m:Singles)-[:PLAYED]->
        (:Round)-[:ROUND_OF]->
        (e:Event)-[:IN_YEAR]->
        (y:Year)
      OPTIONAL MATCH (e)-[:ON_SURFACE]-(z:Surface)
      WITH
        s,
        z,
        y,
        CASE
          WHEN m:Main THEN 'Main'
          ELSE 'Qualifying'
        END AS draw,
        CASE
          WHEN e.category IS NOT NULL THEN e.category
          WHEN p:ATP THEN coalesce(e.atp_category, e.men_category, null)
          ELSE coalesce(e.wta_category, e.women_category, null)
        END AS category
      RETURN
        apoc.map.merge(
          apoc.map.removeKeys(
            s,
            [
              's1',
              's2',
              's3',
              's4',
              's5',
              't1',
              't2',
              't3',
              't4',
              't5',
              'id',
              'incomplete'
            ]
          ),
          {surface: properties(z), year: y.id, draw: draw, category: category}
        ) AS stat
    `,
    { id }
  )

  const stats = records.map(record => {
    const stat = record.get("stat")

    const { surface, draw, category, ...rest } = stat
    const numberKeys = Object.keys(rest)

    const level = CHALLENGER_CATEGORIES.includes(category)
      ? "Tour"
      : ITF_MEN_CATEGORIES.includes(category) || ITF_WOMEN_CATEGORIES.includes(category)
      ? "ITF"
      : "Tour"

    for (const key of numberKeys) {
      if (rest[key]) rest[key] = rest[key]?.toInt()
    }

    return {
      ...rest,
      surface,
      draw,
      category,
      level
    }
  })

  return stats
})
