import { ZodError } from "zod"

export default defineEventHandler(async event => {
  const params = getQuery(event)

  try {
    const query = `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH (p)-[v1:REPRESENTS]->(c:Country)
      OPTIONAL MATCH (p)-[v2:REPRESENTED]->(c2:Country)
      OPTIONAL MATCH (p)-[:TURNED_PRO]->(tp:Year)
      OPTIONAL MATCH (p)-[:RETIRED]->(ret:Year)
      OPTIONAL MATCH (p)-[:HOF]->(hof:Year)
      OPTIONAL MATCH (x1:Coach)-[t1:COACHES]->(p)
      OPTIONAL MATCH (x2:Coach)-[t2:COACHED]->(p)

      WITH
        p,
        tp.id AS turned_pro,
        ret.id AS retired,
        hof.id AS hof,
        COLLECT(DISTINCT
          apoc.map.clean(
            apoc.map.merge(
              properties(c2),
              { start_date: v2.start_date, end_date: v2.end_date }
            ),
            [],
            [null]
          )
        ) AS former_countries,
        apoc.map.clean(
          apoc.map.merge(
            properties(c),
            { start_date: v1.start_date }
          ),
          [],
          [null]
        ) AS country,
        COLLECT(DISTINCT
          apoc.map.clean(
            apoc.map.merge(
              apoc.map.submap(
                x1,
                ['id', 'first_name', 'last_name'],
                null,
                false
              ),
              {
                labels: labels(x1),
                years: t1.years
              }
            ),
            [],
            [null]
          )
        ) AS coaches,
        COLLECT(DISTINCT
          apoc.map.clean(
            apoc.map.merge(
              apoc.map.submap(
                x2,
                ['id', 'first_name', 'last_name'],
                null,
                false
              ),
              {
                labels: labels(x2),
                years: t2.years
              }
            ),
            [],
            [null]
          )
        ) AS former_coaches,
        [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour

        // Remove nulls
        RETURN apoc.map.clean(
          apoc.map.merge(
            properties(p),
            {
              tour: tour,
              country: country,
              former_countries: former_countries,
              coaches: coaches,
              former_coaches: former_coaches,
              turned_pro: turned_pro,
              retired: retired,
              hof: hof,
              age: CASE
                WHEN
                  p.dod IS NOT NULL AND p.dob IS NOT NULL
                  THEN duration.between(p.dob, p.dod).years
                WHEN p.dob IS NOT NULL THEN duration.between(p.dob, date()).years
                ELSE null
              END
            }
          ),
          [],
          [null, [{}], {}]
        ) AS player
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    const results = playerDetailsSchema.parse(records[0]!.get("player"))

    return {
      results,
      statusObjects
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: formatZodError(error)
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Error fetching ${params.id}`,
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
