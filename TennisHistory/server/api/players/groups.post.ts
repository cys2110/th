import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerQuerySchema.parse(body))

    let query = ""
    const grouping = params.grouping[0]

    switch (grouping) {
      case "country":
        query += `/* cypher */
          MATCH (c:Country)
          OPTIONAL MATCH (p:Player)-[:REPRESENTS]->(c)
        `

        if (params.countries.length || params.tours.length || params.players.length || params.coaches.length) {
          const whereClauses: string[] = []

          if (params.countries.length) whereClauses.push("c.id IN $countries")

          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

          if (params.players.length) whereClauses.push("p.id IN $players")

          if (params.coaches.length) whereClauses.push("EXISTS { MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches) }")

          query += `
            WHERE ${whereClauses.join(" AND ")}
          `
        }

        const countrySortDirection =
          params.sortField.some(f => f.field === "country") ? params.sortField.find(f => f.field === "country")!.direction : "ASC"

        query += `/* cypher */
          WITH COUNT(p) AS count, c
          ORDER BY c.name ${countrySortDirection}
          RETURN {
            id: 'g:country:' || c.id,
            __group: true,
            count: count,
            has_children: CASE WHEN count > 0 THEN true ELSE false END,
            group_key: properties(c),
            subRows: []
          } AS results
        `
        break
      case "min_year":
        query = `/* cypher */
          MATCH
            (p:Player)-[:ENTERED]->
            (:Entry)-[:SCORED]->
            (:Score)-[:SCORED]-
            (:Match)-[:PLAYED]->
            (:Round)-[:ROUND_OF]-
            (:Event)-[:EVENT_OF]-
            (:Edition)-[:IN_YEAR]->
            (y:Year)
        `

        if (params.tours.length || params.players.length || params.coaches.length || params.countries.length) {
          const whereClauses: string[] = []

          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

          if (params.players.length) whereClauses.push("p.id IN $players")

          if (params.coaches.length) whereClauses.push("EXISTS { MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches) }")

          if (params.countries.length) whereClauses.push("EXISTS { MATCH (p)-[:REPRESENTS]->(c:Country WHERE c.id IN $countries) }")

          query += `
            WHERE ${whereClauses.join(" AND ")}
          `
        }

        const minYearSortDirection =
          params.sortField.some(f => f.field === "min_year") ? params.sortField.find(f => f.field === "min_year")!.direction : "ASC"

        query += `/* cypher */
          WITH p, min(y.id) AS min_year
          WITH COUNT(p) AS count, min_year
          ORDER BY min_year ${minYearSortDirection}

          RETURN {
            id: 'g:min_year:' || toString(min_year),
            __group: true,
            count: count,
            has_children:
              CASE
                WHEN count > 0 THEN true
                ELSE false
              END,
            group_key: { key: min_year },
            subRows: []
          } AS results
        `
        break
      case "max_year":
        query = `/* cypher */
          MATCH
            (p:Player)-[:ENTERED]->
            (:Entry)-[:SCORED]->
            (:Score)-[:SCORED]-
            (:Match)-[:PLAYED]->
            (:Round)-[:ROUND_OF]-
            (:Event)-[:EVENT_OF]-
            (:Edition)-[:IN_YEAR]->
            (y:Year)
        `

        if (params.tours.length || params.players.length || params.coaches.length || params.countries.length) {
          const whereClauses: string[] = []

          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

          if (params.players.length) whereClauses.push("p.id IN $players")

          if (params.coaches.length) whereClauses.push("EXISTS { MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches) }")

          if (params.countries.length) whereClauses.push("EXISTS { MATCH (p)-[:REPRESENTS]->(c:Country WHERE c.id IN $countries) }")

          query += `
            WHERE ${whereClauses.join(" AND ")}
          `
        }

        const maxYearSortDirection =
          params.sortField.some(f => f.field === "max_year") ? params.sortField.find(f => f.field === "max_year")!.direction : "ASC"

        query += `/* cypher */
          WITH p, max(y.id) AS max_year
          WITH COUNT(p) AS count, max_year
          ORDER BY max_year ${maxYearSortDirection}

          RETURN {
            id: 'g:min_year:' || toString(max_year),
            __group: true,
            count: count,
            has_children:
              CASE
                WHEN count > 0 THEN true
                ELSE false
              END,
            group_key: { key: max_year },
            subRows: []
          } AS results
        `
        break
      default:
        throw new Error(`Invalid grouping: ${grouping}`)
    }

    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("results")

      return groupedResultsSchema.parse(result)
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
        data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
      })
    }

    console.error(error)
    throw error
  }
})
