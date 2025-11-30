export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => querySchema.parse(body))

  const { records: countRecords } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (p:Player)
      WHERE
        (SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(p))) AND
        (SIZE($players) = 0 OR p.id IN $players) AND
        (SIZE($coaches) = 0 OR
          EXISTS {
            MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches)
          }) AND
        ($max_year IS NULL AND $min_year IS NULL AND $status IS NULL OR
          EXISTS {
            MATCH
              (p)-[:ENTERED]->
              (:Entry)-[:SCORED]->
              (:Score)-[:SCORED]->
              (:Match)-[:PLAYED]->
              (:Round)-[:ROUND_OF]->
              (:Event)-[:EVENT_OF]-(:Edition)-[:IN_YEAR]->
              (y:Year)
            WHERE
              ($status IS NULL OR
                ($status = true AND y.id = date().year) OR
                ($status = false AND y.id < date().year)) AND
              (($min_year IS NULL OR y.id >= $min_year) AND
                ($max_year IS NULL OR y.id <= $max_year))
          })
      OPTIONAL MATCH (p)-[:REPRESENTS]->(c:Country) WHERE (SIZE($countries) = 0 OR c.id IN $countries)
      RETURN COUNT(p) AS count
    `,
    params
  )

  const count = countRecords[0]?.get("count").toInt() || 0

  if (count === 0) {
    return {
      count: 0,
      players: []
    }
  }

  let query = `/* cypher */
      MATCH (p:Player)
      WHERE
        (SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(p))) AND
        (SIZE($players) = 0 OR p.id IN $players)
      OPTIONAL MATCH (p)-[:REPRESENTS]->(c:Country)
      CALL (p) {
        OPTIONAL MATCH (coach:Coach)-[t:COACHES|COACHED]->(p)
        RETURN
          CASE WHEN COUNT(coach) = 0 THEN null ELSE
          COLLECT(
            DISTINCT
            apoc.map.clean(
              apoc.map.merge(
                apoc.map.submap(
                  coach,
                  ['id', 'first_name', 'last_name'],
                  null,
                  false
                ),
                {
                  labels: labels(coach),
                  years: t.years
                }
              ),
              [],
              [null]
            )) END AS coaches
      }
      CALL (p) {
        OPTIONAL MATCH
          (p)-[:ENTERED]->
          (:Entry)-[:SCORED]->
          (:Score)-[:SCORED]->
          (:Match)-[:PLAYED]->
          (:Round)-[:ROUND_OF]->
          (:Event)-[:EVENT_OF]-(:Edition)-[:IN_YEAR]->
          (y:Year)
        RETURN min(y.id) AS minYear, max(y.id) AS maxYear
      }
      WITH p, c, coaches, minYear, maxYear, [x IN coaches | x.id] AS coach_ids, [x IN labels(p) WHERE NOT x IN ['Player', 'Coach']][0] AS tour, c.id AS country_id
      WHERE
        ($min_year IS NULL OR minYear >= $min_year) AND
        ($max_year IS NULL OR maxYear <= $max_year) AND
        (SIZE($coaches) = 0 OR
          (SIZE(coach_ids) > 0 AND ANY(id IN $coaches WHERE id IN coach_ids))) AND
        ($status IS NULL OR
          ($status = true AND maxYear = date().year) OR
          ($status = false AND maxYear < date().year)) AND
        (SIZE($countries) = 0 OR country_id IN $countries)
      WITH p, c, coaches, minYear, maxYear, tour
      ORDER BY
    `

  if (params.sortField.length > 0) {
    query += params.sortField
      .map(({ field, direction }: { field: string; direction: "ASC" | "DESC" }) => {
        const keyName = field === "name" ? "p.last_name, p.last_name" : field ?? "p.last_name, p.first_name"
        return keyName + " " + direction
      })
      .join(", ")
  } else {
    query += `p.last_name, p.first_name`
  }

  query += `/* cypher */
    SKIP $skip
    LIMIT $offset
    RETURN
      apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false),
          {
            country: properties(c),
            tour: tour,
            coaches: coaches,
            min_year: minYear,
            max_year: maxYear
          }
        ),
        [],
        [null]
      ) AS player
    `

  const { records } = await useDriver().executeQuery(query, params)

  const results = records.map(record => {
    const player = record.get("player")

    return playerSchema.parse(player)
  })

  return {
    count: count as number,
    players: results
  }
})
