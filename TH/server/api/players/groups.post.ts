import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerQuerySchema.parse(body))

    let query = ""

    switch (params.grouping) {
      case "country":
        query += `/* cypher */
          MATCH (p:Player)-[:REPRESENTS]->(c:Country)
        `

        if (params.tours.length || params.players.length || params.coaches.length || params.countries.length || params.min_year || params.max_year) {
          const whereClauses: string[] = []

          if (params.countries.length) whereClauses.push("c.id IN $countries")

          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

          if (params.players.length) whereClauses.push("p.id IN $players")

          if (params.coaches.length) whereClauses.push("EXISTS { MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches) }")

          if (params.min_year)
            whereClauses.push(
              "NOT EXISTS { MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year WHERE y.year < $min_year) }"
            )

          if (params.max_year)
            whereClauses.push(
              "EXISTS { MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year WHERE y.year > $max_year) }"
            )

          query += `
            WHERE ${whereClauses.join(" AND ")}
          `
        }

        const countrySortDirection = params.sortField.find(f => f.field === "country")?.direction ?? "ASC"

        query += `/* cypher */
          WITH c, COUNT(p) AS count
          ORDER BY c.name ${countrySortDirection}

          RETURN {
            id: 'g:country:' || c.id,
            __group: true,
            count: count,
            has_children: CASE
              WHEN count > 0 THEN true
              ELSE false
            END,
            group: properties(c),
            subRows: []
          } AS results
        `
        break
      case "min_year":
        query += `/* cypher */
          MATCH (p:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year)

          WITH DISTINCT p, y
        `

        if (params.tours.length || params.players.length || params.coaches.length || params.countries.length || params.min_year || params.max_year) {
          const whereClauses: string[] = []

          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

          if (params.players.length) whereClauses.push("p.id IN $players")

          if (params.coaches.length) whereClauses.push("EXISTS { MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches) }")

          if (params.countries.length) whereClauses.push("EXISTS { MATCH (p)-[:REPRESENTS]->(c:Country WHERE c.id IN $countries) }")

          if (params.min_year) whereClauses.push("y.id >= $min_year")

          if (params.max_year) whereClauses.push("y.id <= $max_year")

          query += `
              WHERE ${whereClauses.join(" AND ")}
            `
        }

        const minYearSortDirection = params.sortField.find(f => f.field === "min_year")?.direction ?? "ASC"

        query += `/* cypher */
            ORDER BY y.id ${minYearSortDirection}

            WITH y, COUNT(p) AS count

            RETURN DISTINCT {
              id: 'g:min_year:' || toString(y.id),
              __group: true,
              count: count,
              has_children:
                CASE
                  WHEN count > 0 THEN true
                  ELSE false
                END,
              group: { year: y.id },
              subRows: []
            } AS results
          `
        break
      case "max_year":
        query += `/* cypher */
          MATCH (p:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]-(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year)

          WITH DISTINCT p, y
        `

        if (params.tours.length || params.players.length || params.coaches.length || params.countries.length || params.min_year || params.max_year) {
          const whereClauses: string[] = []

          if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(p))")

          if (params.players.length) whereClauses.push("p.id IN $players")

          if (params.coaches.length) whereClauses.push("EXISTS { MATCH (p)<-[:COACHES|COACHED]-(coach:Coach WHERE coach.id IN $coaches) }")

          if (params.countries.length) whereClauses.push("EXISTS { MATCH (p)-[:REPRESENTS]->(c:Country WHERE c.id IN $countries) }")

          if (params.min_year) whereClauses.push("y.id >= $min_year")

          if (params.max_year) whereClauses.push("y.id <= $max_year")

          query += `
              WHERE ${whereClauses.join(" AND ")}
            `
        }

        const maxYearSortDirection = params.sortField.find(f => f.field === "max_year")?.direction ?? "ASC"

        query += `/* cypher */
            ORDER BY y.id ${maxYearSortDirection}

            WITH y, COUNT(p) AS count

            RETURN DISTINCT {
              id: 'g:max_year:' || toString(y.id),
              __group: true,
              count: count,
              has_children:
                CASE
                  WHEN count > 0 THEN true
                  ELSE false
                END,
              group: { year: y.id },
              subRows: []
            } AS results
          `
        break
      default:
        throw createError({
          statusCode: 400,
          statusMessage: "Grouping parameter must be one of 'country', 'max_year' or 'min_year'."
        })
    }

    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("results")
      return groupedPlayerResultsSchema.parse(result)
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
