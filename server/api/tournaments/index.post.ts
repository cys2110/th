export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => querySchema.parse(body))

  const { records: countRecords } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (t:Tournament)
      WHERE (SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(t)))
      AND (SIZE($tournaments) = 0 OR t.id IN $tournaments)
      AND ($established IS NULL OR
        EXISTS {
          MATCH (t)-[:ESTABLISHED]->(y:Year WHERE y.id >= $established)
        })
      AND ($abolished IS NULL OR
        EXISTS {
          MATCH (t)-[:ABOLISHED]->(y:Year WHERE y.id <= $abolished)
        })
    RETURN COUNT(t) AS count
    `,
    params
  )

  const count: number = countRecords[0]?.get("count").toInt() || 0

  if (count === 0) {
    return {
      count: 0,
      tournaments: []
    }
  }

  let query = `/* cypher */
    MATCH (t:Tournament)

    // Get established and abolished years for all tournaments
    OPTIONAL MATCH (t)-[:ESTABLISHED]->(e:Year)
    OPTIONAL MATCH (t)-[:ABOLISHED]->(a:Year)

    // Filter out tournaments
    WITH t, e.id AS established, a.id AS abolished
    WHERE ($established IS NULL OR established >= $established)
      AND ($abolished IS NULL OR abolished <= $abolished)
      AND (SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(t)))
      AND (SIZE($tournaments) = 0 OR t.id IN $tournaments)

    WITH t, established, abolished
    ORDER BY
  `

  if (params.sortField) {
    query += params.sortField
      .map(({ field, direction }: { field: string; direction: "ASC" | "DESC" }) => {
        const keyName = field === "name" ? "t.name" : field ?? "t.name"
        return keyName + " " + direction
      })
      .join(", ")
  }

  // Always add name as a tiebreaker
  if (!Object.keys(params.sortField).includes("name")) {
    query += `, t.name`
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
    ) AS tournament`

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
