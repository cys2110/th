import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerQuerySchema.parse(body))

    let countQuery = "MATCH (p:Player)"

    if (params.tours.length || params.players.length || params.coaches.length || params.countries.length || params.min_year || params.max_year) {
      const whereClauses: string[] = []

      if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

      if (params.players.length) whereClauses.push("p.id IN $players")

      if (params.coaches.length) whereClauses.push("EXISTS { MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches) }")

      if (params.countries.length) whereClauses.push("EXISTS { MATCH (p)-[:REPRESENTS]->(c:Country WHERE c.id IN $countries) }")

      if (params.min_year)
        whereClauses.push(
          "NOT EXISTS { MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year WHERE y.year < $min_year) }"
        )

      if (params.max_year)
        whereClauses.push(
          "EXISTS { MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year WHERE y.year > $max_year) }"
        )

      countQuery += `
        WHERE ${whereClauses.join(" AND ")}
      `
    }

    countQuery += `
      RETURN COUNT(p) AS count
    `

    const { records: countRecords } = await useDriver().executeQuery(countQuery, params)

    const count: number = countRecords[0]?.get("count").toInt() || 0

    // Early return if no players match criteria
    if (count === 0) {
      return {
        count: 0,
        players: []
      }
    }

    let query = `/* cypher */
      MATCH (p:Player)-[:REPRESENTS]->(c:Country)
      MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year)

      WITH p, c, min(y.id) AS min_year, max(y.id) AS max_year
    `

    if (params.tours.length || params.players.length || params.countries.length || params.min_year || params.max_year) {
      const whereClauses: string[] = []

      if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

      if (params.players.length) whereClauses.push("p.id IN $players")

      if (params.countries.length) whereClauses.push("c.id IN $countries")

      if (params.min_year) whereClauses.push("min_year >= $min_year")

      if (params.max_year) whereClauses.push("max_year <= $max_year")

      query += `
        WHERE ${whereClauses.join(" AND ")}
      `
    }

    query += `/* cypher */
      OPTIONAL MATCH (coach:Coach)-[t:COACHES|COACHED]->(p)
    `

    if (params.coaches.length) {
      query += " WHERE coach.id IN $coaches"
    }

    query += `/* cypher */
      WITH
        p,
        c,
        min_year,
        max_year,
        [x IN labels(p) WHERE NOT x IN ['Player', 'Coach']][0] AS tour,
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
          )
        ) AS coaches
    `

    const sortFieldMap: Record<string, string[]> = {
      country: ["c.name"],
      min_year: ["min_year"],
      max_year: ["max_year"],
      name: ["p.last_name", "p.first_name"]
    }

    const sortClauses: string[] = []

    if (params.sortField.length) {
      for (const field of params.sortField) {
        sortClauses.push(`${sortFieldMap[field.field as keyof typeof sortFieldMap].join(", ")} ${field.direction}`)
      }
    }

    if (!params.sortField.length || !params.sortField.some(f => f.field === "name")) {
      sortClauses.push("p.last_name ASC, p.first_name ASC")
    }

    query += `/* cypher */
      ORDER BY ${sortClauses.join(", ")}
      SKIP $skip
      LIMIT $itemsPerPage

      // Remove any null values
      RETURN apoc.map.clean(
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
        [null, [{}]]
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
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
      })
    }

    console.error(error)
    throw error
  }
})
