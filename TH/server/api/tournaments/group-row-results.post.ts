import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => tournamentQuerySchema.parse(body))

    let query: string = ""

    if (params.grouping === "established") {
      query = "MATCH (t:Tournament)-[:ESTABLISHED]->(e:Year {id: $key})"

      if (params.abolished) {
        query += `
          MATCH (t)-[:ABOLISHED]->(a:Year WHERE a.id <= $abolished)
        `
      } else {
        query += `
          OPTIONAL MATCH (t)-[:ABOLISHED]->(a:Year)
        `
      }
    } else if (params.grouping === "abolished") {
      query = "MATCH (t:Tournament)-[:ABOLISHED]->(a:Year {id: $key})"

      if (params.established) {
        query += `
          MATCH (t)-[:ESTABLISHED]->(e:Year WHERE e.id >= $established)
        `
      } else {
        query += `
          OPTIONAL MATCH (t)-[:ESTABLISHED]->(e:Year)
        `
      }
    }

    if (params.tours.length || params.tournaments.length) {
      const whereClauses: string[] = []

      if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(t))")
      if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")

      query += `
        WHERE ${whereClauses.join(" AND ")}
      `
    }

    const tournamentSortDirection = params.sortField.find(f => f.field === "name")?.direction ?? "ASC"

    query += `/* cypher */
      WITH t, e.id AS established, a.id AS abolished
      ORDER BY t.name ${tournamentSortDirection}

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

    const { records, summary } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("tournament")
      return tournamentSchema.parse(result)
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
