import { ZodError } from "zod"

export default defineEventHandler(async event => {
  const params = getQuery(event)

  try {
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

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    const results = playerOverviewSchema.parse(records[0]!.get("player"))

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
