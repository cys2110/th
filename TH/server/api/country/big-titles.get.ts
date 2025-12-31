export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const categories = [
    "Grand Slam",
    "ATP Masters 1000",
    "ATP Masters Series",
    "ATP Super 9",
    "ATP Championship Series, Single Week",
    "Premier Mandatory",
    "WTA 1000",
    "Olympics",
    "Finals"
  ]

  let query = `/* cypher */
    MATCH (c:Country {id: $id})
    OPTIONAL MATCH (c)<-[z:REPRESENTS | REPRESENTED]-
      (p:Player)-[:ENTERED]->
      (:Entry)-[:SCORED]->
      (:Winner)-[:SCORED]->
      (:Match)-[:PLAYED]->
      (r:Round {round: 'Final'})-[:ROUND_OF]->
      (e:Event)-[:EVENT_OF]->
      (ed:Edition)-[:IN_YEAR]->
      (y:Year)
    OPTIONAL MATCH (ed)-[:EDITION_OF]->(t:Tournament)

    // Filter for only players who represented the country at the time of the event
    WHERE (type(z) = 'REPRESENTED' AND z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date >= coalesce(e.start_date, ed.start_date)) OR
      type(z) = 'REPRESENTS'

    // Filter for only big title categories
    WITH
      p,
      c,
      y,
      t,
      ed,
      [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour,
      [x IN labels(r) WHERE x IN ['Singles', 'Doubles']][0] AS type,
      coalesce(e.category, ed.category) AS category,
      coalesce(e.start_date, ed.start_date) AS start_date
    WHERE category IN $categories

    // Order by player name and event date
    ORDER BY toLower(p.last_name), toLower(p.first_name), start_date

    // Remove any null values
    RETURN
      apoc.map.clean(
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
        ),
        [],
        [null]
      ) AS result
  `

  const { records } = await useDriver().executeQuery(query, { id, categories })

  const results = records.map(record => {
    const result = record.get("result")
    return countryTitleSchema.parse(result)
  })

  return results
})
