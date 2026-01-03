export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => tournamentQuerySchema.parse(body))

  let countQuery = `/* cypher */
    MATCH (t:Tournament)
  `

  if (params.abolished || params.established || params.tours.length || params.tournaments.length) {
    const whereClauses: string[] = []

    if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(t))")
    if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")
    if (params.established) {
      whereClauses.push(`
        EXISTS {
          MATCH (t)-[:ESTABLISHED]->(y:Year WHERE y.id >= $established)
        }
      `)
    }
    if (params.abolished) {
      whereClauses.push(`
        EXISTS {
          MATCH (t)-[:ABOLISHED]->(y:Year WHERE y.id <= $abolished)
        }
      `)
    }

    countQuery += " WHERE " + whereClauses.join(" AND ")
  }

  countQuery += " RETURN COUNT(DISTINCT t) AS count"

  const { records: countRecords } = await useDriver().executeQuery(countQuery, params)
  const count: number = countRecords[0]?.get("count").toInt() || 0

  if (count === 0) {
    return {
      count: 0,
      tournaments: []
    }
  }

  let query = `/* cypher */
    MATCH (t:Tournament)
    OPTIONAL MATCH (t)-[:ESTABLISHED]->(e:Year)
    OPTIONAL MATCH (t)-[:ABOLISHED]->(a:Year)

    WITH t, e.id AS established, a.id AS abolished
  `

  if (params.abolished || params.established || params.tours.length || params.tournaments.length) {
    const whereClauses: string[] = []

    if (params.tours.length) whereClauses.push("ANY(x IN $tours WHERE x IN labels(t))")
    if (params.tournaments.length) whereClauses.push("t.id IN $tournaments")
    if (params.established) whereClauses.push("established >= $established")
    if (params.abolished) whereClauses.push("abolished <= $abolished")

    query += " WHERE " + whereClauses.join(" AND ")
  }

  query += `
    ORDER BY
  `

  if (params.sortField.length) {
    query += params.sortField
      .map(({ field, direction }: { field: string; direction: "ASC" | "DESC" }) => {
        const keyName = field === "name" ? "toLower(t.name)" : field
        return keyName + " " + direction
      })
      .join(", ")

    // Always add name as a tiebreaker
    if (!Object.keys(params.sortField).includes("name")) {
      query += `, toLower(t.name)`
    }
  } else {
    query += `toLower(t.name)`
  }

  query += `/* cypher */
    SKIP $skip
    LIMIT $offset

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
    const tournament = record.get("tournament")
    return tournamentSchema.parse(tournament)
  })

  return {
    count,
    tournaments: results
  }
})
