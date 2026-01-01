

export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => playerQuerySchema.parse(body))

  // Build dynamic count query to avoid overloading neo4j
  let countQuery = `/* cypher */
    MATCH (p:Player)
  `

  if (params.tours.length || params.players.length || params.coaches.length) {
    countQuery += " WHERE"

    if (params.tours.length) {
      countQuery += " ANY(x IN $tours WHERE x IN labels(p))"
    }

    if (params.players.length) {
      countQuery += `${params.tours.length ? " AND" : ""} p.id IN $players`
    }

    if (params.coaches.length) {
      countQuery += `${params.tours.length || params.players.length ? " AND" : ""}
        EXISTS {
          MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches)
        }
      `
    }
  }

  if (params.countries.length) {
    countQuery += `
        OPTIONAL MATCH (p)-[:REPRESENTS]->(c:Country WHERE c.id IN $countries)
      `
  }

  countQuery += `
    RETURN COUNT(p) AS count
  `

  const { records: countRecords } = await useDriver().executeQuery(countQuery, params)

  const count: number = countRecords[0]?.get("count").toInt() || 0

  if (count === 0) {
    return {
      count: 0,
      players: []
    }
  }

  let query = `/* cypher */
    MATCH (p:Player)-[:REPRESENTS]->(c:Country)
  `

  if (params.tours.length || params.players.length || params.countries.length) {
    query += `
      WHERE
    `

    if (params.tours.length) {
      query += "ANY(x IN $tours WHERE x IN labels(p))"
    }

    if (params.players.length) {
      query += `${params.tours.length ? " AND" : ""} p.id IN $players`
    }

    if (params.countries.length) {
      query += `${params.tours.length || params.players.length || params.coaches.length ? " AND" : ""} country_id IN $countries`
    }
  }

  query += `
    // Get player's coaches
    CALL (p) {
      OPTIONAL MATCH (coach:Coach)-[t:COACHES|COACHED]->(p)
  `

  if (params.coaches.length) {
    query += " WHERE coach.id IN $coaches"
  }

  query += `
      RETURN
        CASE WHEN COUNT(coach) = 0 THEN [] ELSE
        COLLECT(DISTINCT
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

    // Get player's first and last tournament years
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

    WITH p, c, coaches, min_year, max_year, [x IN labels(p) WHERE NOT x IN ['Player', 'Coach']][0] AS tour
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
    results
  }
})
