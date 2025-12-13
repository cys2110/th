export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    WITH ['Grand Slam', 'ATP Masters 1000', 'ATP Masters Series', 'ATP Super 9', 'ATP Championship Series, Single Week', 'Premier Mandatory', 'WTA 1000', 'Olympics', 'Finals'] AS categories

    MATCH (c:Country {id: $id})
    OPTIONAL MATCH (c)<-[z:REPRESENTS | REPRESENTED]-(p:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(:Winner)-[:SCORED]->(:Match)-[:PLAYED]->(r:Round {round: 'Final'})-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:IN_YEAR]->(y:Year)
    WHERE ((type(z) = 'REPRESENTED' AND z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date >= coalesce(e.start_date, ed.start_date)) OR type(z) = 'REPRESENTS')
    OPTIONAL MATCH (ed)-[:EDITION_OF]->(t:Tournament)

    WITH
      p,
      c,
      y,
      t,
      ed,
      [x IN labels(p) WHERE NOT x IN ['Player', 'Coach']][0] AS tour,
      CASE WHEN r:Singles THEN 'Singles' ELSE 'Doubles' END AS type,
      coalesce(e.category, ed.category) AS category
    WHERE category IN categories
    ORDER BY toLower(p.last_name), toLower(p.first_name), y.id

    RETURN
      apoc.map.merge(
        apoc.map.submap(
          p,
          ['id', 'first_name', 'last_name']
        ),
        {
          tour: tour,
          edition: {
            type: type,
            id: ed.id,
            category: category,
            tournament: properties(t),
            year: y.id
          }
        }
      ) AS result
    `,
    { id }
  )

  const results = records.map(record => {
    const result = record.get("result")

    return countryTitleSchema.parse(result)
  })

  return results
})
