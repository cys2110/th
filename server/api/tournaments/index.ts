import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    skip: string
    filters: any
  }

  const { skip, filters } = getQuery<QueryProps>(event)
  const { tours, tournaments, established, abolished } = JSON.parse(filters)

  const formattedParams = {
    skip: int(skip),
    tours,
    tournaments: Array.isArray(tournaments) ? tournaments.map((t: any) => int(t.value)) : [int(tournaments.value)],
    established: established ? int(established) : null,
    abolished: abolished ? int(abolished) : null
  }

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    CALL () {
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
    }
    CALL () {
      MATCH (t:Tournament)
        WHERE (SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(t)))
        AND (SIZE($tournaments) = 0 OR t.id IN $tournaments)
      CALL (t) {
        OPTIONAL MATCH (t)-[:ESTABLISHED]->(e:Year)
        OPTIONAL MATCH (t)-[:ABOLISHED]->(a:Year)
        RETURN e.id AS established, a.id AS abolished
      }
      WITH t, established, abolished
        WHERE ($established IS NULL OR established >= $established)
        AND ($abolished IS NULL OR abolished <= $abolished)
      ORDER BY t.name
      SKIP $skip
      LIMIT 40
      RETURN apoc.map.clean(apoc.map.merge(properties(t), {established: established, abolished: abolished, tours: [x IN labels(t) WHERE x <> 'Tournament']}) , [], [null]) AS tournament
    }
    RETURN count, tournament
    `,
    formattedParams
  )

  console.log(
    `Notifications for tournaments: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (!records?.[0]?.get("tournament") || Object.keys(records[0]?.get("tournament")).length === 0) {
    return {
      count: 0,
      tournaments: []
    }
  }

  const results = records.map(record => {
    const tournament = record.get("tournament")
    const numberKeys = ["id", "established", "abolished"]

    for (const key of numberKeys) {
      if (tournament[key]) tournament[key] = tournament[key].toInt()
    }

    return tournament
  })

  return {
    count: records[0].get("count").toInt(),
    tournaments: results
  }
})
