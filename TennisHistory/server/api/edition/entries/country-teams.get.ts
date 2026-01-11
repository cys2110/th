export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery(event)

    const query = `/* cypher */
      MATCH (c:Country)-[:ENTERED]->(cf:CountryEntry)
      OPTIONAL MATCH (cf)<-[:MEMBER_OF]-(f:Entry)<-[t:ENTERED]-(p:Player) WHERE cf.id STARTS WITH $edId

      WITH
        c,
        cf,
        p,
        COLLECT(DISTINCT apoc.map.clean({
          rank: t.rank,
          type: CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END
        }, [], [null])) AS entries

      WITH
        c,
        cf,
        p,
        [x IN entries WHERE x.type = 'Singles'] AS singles,
        [x IN entries WHERE x.type = 'Doubles'] AS doubles

      WITH
        c,
        cf,
        COLLECT(DISTINCT apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
            {
              tour: [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0],
              singles: CASE WHEN SIZE(singles) > 0 THEN singles[0].rank ELSE NULL END,
              doubles: CASE WHEN SIZE(doubles) > 0 THEN doubles[0].rank ELSE NULL END
            }
          ),
          [], [null]
        )) AS players

      RETURN apoc.map.clean(
        apoc.map.merge(
          properties(c),
          {
            seed: cf.seed,
            team: players
          }
        ),
        [], [null, [{}]]
      ) AS country

      ORDER BY country.seed, country.name
    `

    const { records } = await useDriver().executeQuery(query, { edId })

    const results = records.map(record => {
      const country = record.get("country")

      return countryTeamSchema.parse(country)
    })

    return results
  } catch (error) {
    throw error
  }
})
