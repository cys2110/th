import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      MATCH (c:Country {id: $id})
      OPTIONAL MATCH (p:Player)-[t:REPRESENTS | REPRESENTED]->(c)
      WHERE
        (type(t) = 'REPRESENTS' AND (p.ch_singles = 1 OR p.ch_doubles = 1)) OR
        (type(t) = 'REPRESENTED' AND p.ch_singles = 1 AND p.singles_ch_date >= t.start_date AND p.singles_ch_date <= t.end_date) OR
        (type(t) = 'REPRESENTED' AND p.ch_doubles = 1 AND p.doubles_ch_date >= t.start_date AND p.doubles_ch_date <= t.end_date)

      WITH
        p,
        [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour

      RETURN apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(
            p,
            ['id', 'first_name', 'last_name', 'ch_singles', 'singles_ch_date', 'ch_doubles', 'doubles_ch_date']
          ),
          { tour: tour }
        ),
        [],
        [null]
      ) AS player
    `

    const { records } = await useDriver().executeQuery(query, params)

    const players = records.map((r: any) => {
      const player = r.get("player")
      return countryNumberOneSchema.parse(player)
    })

    return players
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
