import { ZodError } from "zod"

export default defineEventHandler(async event => {
  const params = getQuery(event)

  try {
    const query = `/* cypher */
      MATCH (c:Country { id: $id })

      CALL (c) {
        MATCH (p:Player)-[:REPRESENTS]->(c)
        WHERE p.ch_singles = 1 OR p.ch_doubles = 1
        OPTIONAL MATCH (p)-[t:REPRESENTED]->(:Country)

        WITH p
        WHERE
          t IS NULL OR
          (p.ch_singles = 1 AND p.singles_ch_date >= t.start_date AND p.singles_ch_date <= t.end_date) OR
          (p.ch_doubles = 1 AND p.doubles_ch_date >= t.start_date AND p.doubles_ch_date <= t.end_date)

        RETURN p AS player, c AS country

        UNION

        MATCH (p:Player)-[t:REPRESENTED]->(c)
        MATCH (p)-[:REPRESENTS]->(d:Country)
        WHERE
          (p.ch_singles = 1 AND p.singles_ch_date >= t.start_date AND p.singles_ch_date <= t.end_date) OR
          (p.ch_doubles = 1 AND p.doubles_ch_date >= t.start_date AND p.doubles_ch_date <= t.end_date)

        RETURN p AS player, d AS country
      }

      RETURN apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(
            player,
            ['id', 'first_name', 'last_name', 'ch_singles', 'singles_ch_date', 'ch_doubles', 'doubles_ch_date'],
            null,
            false
          ),
          {
            tour: [x IN labels(player) WHERE x IN ['ATP', 'WTA']][0],
            country: properties(country)
          }
        ),
        [],
        [null]
      ) AS player
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    const results = records.map(record => {
      const result = record.get("player")
      return countryNumberOneSchema.parse(result)
    })

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
      statusMessage: `Error fetching ${params.id} number ones`,
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
