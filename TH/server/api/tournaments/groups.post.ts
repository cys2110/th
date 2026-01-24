import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => tournamentQuerySchema.parse(body))

    let query = ""

    switch (params.grouping) {
      case "established":
        query = `/* cypher */
          MATCH (t:Tournament)-[:ESTABLISHED]->(e:Year)
        `

        if (params.established || params.abolished || params.tours.length || params.tournaments.length) {
          const whereClauses: string[] = []

          if (params.established) whereClauses.push("e.id >= $established")
          if (params.abolished) whereClauses.push("EXISTS { MATCH (t)-[:ABOLISHED]->(a:Year WHERE a.id <= $abolished) }")
          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(t))")
          if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")

          query += `
            WHERE ${whereClauses.join(" AND ")}
          `
        }

        const establishedSortDirection = params.sortField.find(f => f.field === "established")?.direction ?? "ASC"

        query += `/* cypher */
          ORDER BY e.id ${establishedSortDirection}

          WITH e, COUNT(t) AS count

          RETURN {
            id: 'g:established:' || toString(e.id),
            __group: true,
            count: count,
            has_children: CASE
              WHEN count > 0 THEN true
              ELSE false
            END,
            group: { year: e.id },
            subRows: []
          } AS results
        `
        break
      case "abolished":
        query = `/* cypher */
          MATCH (t:Tournament)-[:ABOLISHED]->(a:Year)
        `

        if (params.established || params.abolished || params.tours.length || params.tournaments.length) {
          const whereClauses: string[] = []

          if (params.established) whereClauses.push("EXISTS { MATCH (t)-[:ESTABLISHED]->(e:Year WHERE e.id >= $established) }")
          if (params.abolished) whereClauses.push("a.id >= $abolished")
          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(t))")
          if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")

          query += `
            WHERE ${whereClauses.join(" AND ")}
          `
        }

        const abolishedSortDirection = params.sortField.find(f => f.field === "abolished")?.direction ?? "ASC"

        query += `/* cypher */
          ORDER BY a.id ${abolishedSortDirection}

          WITH a, COUNT(t) AS count

          RETURN {
            id: 'g:abolished:' || toString(a.id),
            __group: true,
            count: count,
            has_children: CASE
              WHEN count > 0 THEN true
              ELSE false
            END,
            group: { year: a.id },
            subRows: []
          } AS results
        `
        break
      default:
        throw createError({
          statusCode: 400,
          statusMessage: "Grouping parameter must be either 'established' or 'abolished'."
        })
    }

    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("results")
      return groupedTournamentResultsSchema.parse(result)
    })

    return {
      count: results.length,
      results
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        // data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
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
