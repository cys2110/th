import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH (p)-[v1:REPRESENTS]->(c:Country)
      OPTIONAL MATCH (p)-[v2:REPRESENTED]->(c2:Country)
      OPTIONAL MATCH (p)-[:TURNED_PRO]->(tp:Year)
      OPTIONAL MATCH (p)-[:RETIRED]->(ret:Year)
      OPTIONAL MATCH (p)-[:HOF]->(hof:Year)
      OPTIONAL MATCH (x1:Coach)-[t1:COACHES]->(p)
      OPTIONAL MATCH (x2:Coach)-[t2:COACHED]->(p)

      WITH p, tp, ret, hof, CASE WHEN COUNT(c2) = 0 THEN [] ELSE COLLECT(DISTINCT
        apoc.map.clean(
          apoc.map.merge(
            properties(c2),
            {start_date: v2.start_date, end_date: v2.end_date}
          ),
          [],
          [null]
        )
      ) END AS former_countries,
      CASE WHEN c IS NULL THEN null ELSE apoc.map.clean(
        apoc.map.merge(
          properties(c),
          {start_date: v1.start_date}
        ),
        [],
        [null]
      ) END AS country,
      CASE WHEN COUNT(x1) = 0 THEN [] ELSE COLLECT(DISTINCT
        apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(
              x1,
              ['id', 'first_name', 'last_name'],
              null,
              false
            ),
            {
              labels: [x IN labels(x1) WHERE x in ['Player']],
              years: t1.years
            }
          ),
          [],
          [null]
        )
      ) END AS coaches,
      CASE WHEN COUNT(x2) = 0 THEN [] ELSE COLLECT(DISTINCT
        apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(
              x2,
              ['id', 'first_name', 'last_name'],
              null,
              false
            ),
            {
              labels: [x IN labels(x2) WHERE x in ['Player']],
              years: t2.years
            }
          ),
          [],
          [null]
        )
      ) END AS former_coaches,
      [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour
      RETURN apoc.map.clean(
        apoc.map.merge(
          properties(p),
          {
            tour: tour,
            country: country,
            former_countries: former_countries,
            coaches: coaches,
            former_coaches: former_coaches,
            turned_pro: tp.id,
            retired: ret.id,
            hof: hof.id,
            age:
              CASE
                WHEN
                  p.dod IS NOT NULL AND p.dob IS NOT NULL
                  THEN duration.between(p.dob, p.dod).years
                WHEN p.dob IS NOT NULL THEN duration.between(p.dob, date()).years
                ELSE null
              END
          }
        ),
        [], [null]
      ) AS player
    `

    const { records } = await useDriver().executeQuery(query, params)

    const player = records[0].get("player")

    return playerDetailsSchema.parse(player)
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
