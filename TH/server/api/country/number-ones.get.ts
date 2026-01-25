import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

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

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "00000")) {
      const players = records.map(record => {
        const player = record.get("player")
        return countryNumberOneSchema.parse(player)
      })

      return players
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Database query error",
      data: summary.gqlStatusObjects.map(s => `${s.gqlStatus}: ${s.statusDescription}`)
    })
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
