/** API route to fetch players by min year */

export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => playerQuerySchema.parse(body))

  let query = `/* cypher */
    MATCH (p:Player)-[:REPRESENTS]->(c:Country)
    MATCH
      (p)-[:ENTERED]->
      (:Entry)-[:SCORED]->
      (:Score)-[:SCORED]->
      (:Match)-[:PLAYED]->
      (:Round)-[:ROUND_OF]->
      (:Event)-[:EVENT_OF]-(:Edition)-[:IN_YEAR]->
      (y:Year)
  `

  if (params.tours.length || params.players.length || params.countries.length) {
    query += " WHERE"

    if (params.tours.length) {
      query += "ANY(x IN $tours WHERE x IN labels(p))"
    }

    if (params.players.length) {
      query += `${params.tours.length ? " AND" : ""} p.id IN $players`
    }

    if (params.countries.length) {
      query += `${params.tours.length || params.players.length || params.coaches.length ? " AND" : ""} c.id IN $countries`
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

    WITH p, c, coaches, min(y.id) AS min_year, max(y.id) AS max_year, [x IN labels(p) WHERE NOT x IN ['Player', 'Coach']][0] AS tour
    WHERE min_year = $key
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

  return results
})
