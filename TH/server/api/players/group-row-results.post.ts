import { ZodError } from "zod"
import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerQuerySchema.parse(body))

    if (params.grouping !== "country") {
      params.key = int(Number(params.key))
    }

    let query = `/* cypher */
      MATCH (p:Player)-[:REPRESENTS]->(c:Country)
      MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year)

      WITH p, c, min(y.id) AS min_year, max(y.id) AS max_year
    `

    const whereClauses: string[] = []

    if (params.grouping === "country") {
      whereClauses.push("c.id = $key")
    } else if (params.grouping === "min_year") {
      whereClauses.push("min_year = $key")
    } else if (params.grouping === "max_year") {
      whereClauses.push("max_year = $key")
    }

    if (params.tours.length || params.players.length || params.countries.length || params.min_year || params.max_year) {
      const whereClauses: string[] = []

      if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

      if (params.players.length) whereClauses.push("p.id IN $players")

      if (params.countries.length) whereClauses.push("c.id IN $countries")

      if (params.min_year) whereClauses.push("min_year >= $min_year")

      if (params.max_year) whereClauses.push("max_year <= $max_year")
    }

    query += `/* cypher */
      WHERE ${whereClauses.join(" AND ")}

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

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.key} could not be found.`
      })
    }

    const results = records.map(record => {
      const player = record.get("player")
      return basePlayerSchema.parse(player)
    })

    return results
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: error.issues.map(i => ({
          [i.path.join(".")]: {
            message: i.message,
            received: i.input
          }
        }))
      })
    }

    console.error(error)
    throw error
  }
})
