import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
      MATCH (:Player {id: $id})-[:ENTERED]->(f:Entry)-[:SCORED]->(:Score)-[:SCORED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(e:Event)-[:EVENT_OF]->(ed:Edition)-[:EDITION_OF]->(t:Tournament)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)

      WITH DISTINCT t, coalesce(e.category, ed.category) AS category, [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'Tour']][0] AS level, [x IN labels(f) WHERE x <> 'Entry'][0] AS matchType, coalesce(es.surface, eds.surface) AS surface

      WITH COLLECT(DISTINCT category) AS categories, COLLECT(DISTINCT level) AS levels, COLLECT(DISTINCT {value: t.id, label: t.name}) AS tournaments, COLLECT(DISTINCT matchType) AS matchTypes, COLLECT(DISTINCT surface) AS surfaces

      RETURN apoc.coll.sort(categories) AS categories, apoc.coll.sort(levels) AS levels, apoc.coll.sort(matchTypes) as matchTypes, apoc.coll.sort(surfaces) AS surfaces, apoc.coll.sortMaps(tournaments, "^label") AS tournaments
    `

    const { records } = await useDriver().executeQuery(query, params)

    const results = records[0].toObject()

    for (const tournament of results.tournaments) {
      tournament.value = tournament.value.toInt()
    }

    return results as {
      categories: string[]
      levels: string[]
      tournaments: { value: number; label: string }[]
      matchTypes: string[]
      surfaces: string[]
    }
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
