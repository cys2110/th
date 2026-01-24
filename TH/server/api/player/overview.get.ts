import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH (p)-[t:REPRESENTS]->(c:Country)
      MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year)

      WITH *
      ORDER BY y.id

      WITH p, properties(c) AS country, COLLECT(DISTINCT y.id) AS years

      RETURN apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(
              p,
              ['id', 'first_name', 'last_name', "official_link", "site_link", "wiki_link"],
              null,
              false
            ),
            {
              tour: [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0],
              country: country,
              years: years
            }
          ),
          [],
          [null]
        ) AS player
    `

    const { records, summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.id} could not be found.`
      })
    }

    const player = records[0].get("player")

    return playerOverviewSchema.parse(player)
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
