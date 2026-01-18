import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => tournamentQuerySchema.parse(body))

    // Get count of all tournaments matching criteria
    let countQuery = "MATCH (t:Tournament)"

    // Apply filters
    if (params.abolished || params.established || params.tours.length || params.tournaments.length) {
      const whereClauses: string[] = []

      if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(t))")
      if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")
      if (params.established) whereClauses.push("EXISTS { MATCH (t)-[:ESTABLISHED]->(y:Year WHERE y.id >= $established) }")
      if (params.abolished) whereClauses.push("EXISTS { MATCH (t)-[:ABOLISHED]->(y:Year WHERE y.id <= $abolished) }")

      countQuery += " WHERE " + whereClauses.join(" AND ")
    }

    countQuery += " RETURN COUNT(t) AS count"

    const { records: countRecords } = await useDriver().executeQuery(countQuery, params)

    const count: number = countRecords[0]?.get("count").toInt() || 0

    // If no tournaments match criteria, early return empty array
    if (count === 0) {
      return {
        count: 0,
        tournaments: [] as TournamentType[]
      }
    }

    let query = "MATCH (t:Tournament)"

    if (params.established) {
      query += `
        MATCH (t)-[:ESTABLISHED]->(e:Year WHERE e.id >= $established)
      `
    } else {
      query += `
        OPTIONAL MATCH (t)-[:ESTABLISHED]->(e:Year)
      `
    }

    if (params.abolished) {
      query += `
        MATCH (t)-[:ABOLISHED]->(a:Year WHERE a.id <= $abolished)
      `
    } else {
      query += `
        OPTIONAL MATCH (t)-[:ABOLISHED]->(a:Year)
      `
    }

    query += `
      WITH t, e.id AS established, a.id AS abolished
    `

    if (params.tours.length || params.tournaments.length) {
      const whereClauses: string[] = []

      if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(t))")
      if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")

      query += " WHERE " + whereClauses.join(" AND ")
    }

    // Apply sorting - default to tournament name
    const sortClauses: string[] = []

    if (params.sortField.length) {
      const sortFields = {
        name: "toLower(t.name)",
        established: "established",
        abolished: "abolished"
      }

      for (const field of params.sortField) {
        sortClauses.push(`${sortFields[field.field as keyof typeof sortFields]} ${field.direction}`)
      }
    }

    if (!Object.keys(params.sortField).includes("name")) sortClauses.push("toLower(t.name)")

    query += `/* cypher */
      ORDER BY ${sortClauses.join(", ")}
      SKIP $skip
      LIMIT $itemsPerPage

      // Remove any null values
      RETURN apoc.map.clean(
        apoc.map.merge(
          properties(t),
          {
            established: established,
            abolished: abolished,
            tours: [x IN labels(t) WHERE x <> 'Tournament']
          }
        ),
        [],
        [null]
      ) AS tournament
    `

    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("tournament")
      return tournamentSchema.parse(result)
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
