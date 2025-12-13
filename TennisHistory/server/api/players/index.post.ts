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

  const count: number = countRecords[0]?.get("count").toInt() || 0

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
          CASE WHEN COUNT(coach) = 0 THEN [] ELSE
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
        RETURN min(y.id) AS min_year, max(y.id) AS max_year
      }
      WITH p, c, coaches, min_year, max_year, [x IN coaches | x.id] AS coach_ids, [x IN labels(p) WHERE NOT x IN ['Player', 'Coach']][0] AS tour, c.id AS country_id
      WHERE
        ($min_year IS NULL OR min_year >= $min_year) AND
        ($max_year IS NULL OR max_year <= $max_year) AND
        (SIZE($coaches) = 0 OR
          (SIZE(coach_ids) > 0 AND ANY(id IN $coaches WHERE id IN coach_ids))) AND
        ($status IS NULL OR
          ($status = true AND max_year = date().year) OR
          ($status = false AND max_year < date().year)) AND
        (SIZE($countries) = 0 OR country_id IN $countries)
      WITH p, c, coaches, min_year, max_year, tour
    `

  const SORT_FIELD_MAP: Record<string, string[]> = {
    country: ["c.name"],
    min_year: ["min_year"],
    max_year: ["max_year"],
    name: ["p.last_name", "p.first_name"]
  }

  if (params.sortField.length) {
    const sortExprs = params.sortField.flatMap(({ field, direction }) => {
      const cols = SORT_FIELD_MAP[field] ?? []
      return cols.map(col => `${col} ${direction}`)
    })

    // Always add name as a tiebreaker if not already present
    if (!params.sortField.some(({ field }) => field === "name")) {
      sortExprs.push("p.last_name", "p.first_name")
    }

    query += " ORDER BY " + sortExprs.join(", ")
  } else {
    query += " ORDER BY p.last_name, p.first_name"
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
            min_year: min_year,
            max_year: max_year
          }
        ),
        [],
        [null]
      ) AS player
    `

  const { records } = await useDriver().executeQuery(query, params)

  const results = records.map(record => {
    const player = record.get("player")

    return basePlayerSchema.parse(player)
  })

  return {
    count,
    players: results
  }
})
