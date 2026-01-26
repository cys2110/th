import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerFormSchema.parse(body))

    let query = `/* cypher */
      MATCH (p:Player { id: $id })
      SET p += $player, p.updated_at = date()
    `

    if ("hof" in params) {
      query += `
        WITH p
        OPTIONAL MATCH (p)-[t1:HOF]->(:Year)
        DELETE t1
      `

      if (params.hof) {
        query += `
          WITH p
          MATCH (y:Year {id: $hof})
          MERGE (p)-[:HOF]->(y)
        `
      }
    }

    if ("turned_pro" in params) {
      query += `
        WITH p
        OPTIONAL MATCH (p)-[t1:TURNED_PRO]->(:Year)
        DELETE t1
      `

      if (params.turned_pro) {
        query += `
          WITH p
          MATCH (y:Year {id: $turned_pro})
          MERGE (p)-[:TURNED_PRO]->(y)
        `
      }
    }

    if ("retired" in params) {
      query += `
        WITH p
        OPTIONAL MATCH (p)-[t1:RETIRED]->(:Year)
        DELETE t1
      `

      if (params.retired) {
        query += `
          WITH p
          MATCH (y:Year {id: $retired})
          MERGE (p)-[:RETIRED]->(y)
        `
      }
    }

    if ("country" in params) {
      query += `
        WITH p
        OPTIONAL MATCH (p)-[v:REPRESENTS]->(c:Country)
        DELETE v
      `

      if (params.country) {
        query += `
          WITH p
          MATCH (c:Country {id: $country.id})
          MERGE (p)-[v1:REPRESENTS]->(c)
          SET v1 += $country.dates
        `
      }
    }

    if ("former_countries" in params) {
      query += `
        WITH p
        OPTIONAL MATCH (p)-[v:REPRESENTED]->(c:Country)
        DELETE v
      `

      if (params.former_countries) {
        query += `
          WITH p
          UNWIND $former_countries AS k
          MATCH (c:Country {id: k.id})
          MERGE (p)-[v1:REPRESENTED]->(c)
          SET v1 += k.dates
        `
      }
    }

    if ("coaches" in params) {
      query += `
        WITH p
        OPTIONAL MATCH (p)<-[v:COACHES]-(c:Coach)
        DELETE v
      `

      if (params.coaches) {
        query += `
          WITH p
          UNWIND $coaches AS k
          MATCH (c:Coach {id: k.id})
          MERGE (c)-[v1:COACHES]->(p)
          SET v1 += k.dates
        `
      }
    }

    if ("former_coaches" in params) {
      query += `
        WITH p
        OPTIONAL MATCH (p)<-[v:COACHED]-(c:Coach)
        DELETE v
      `

      if (params.former_coaches) {
        query += `
          WITH p
          UNWIND $former_coaches AS k
          MATCH (c:Coach {id: k.id})
          MERGE (c)-[v1:COACHED]->(p)
          SET v1 += k.dates
        `
      }
    }

    const { summary } = await useDriver().executeQuery(query, params)

    const statusObjects = formatGqlStatusObjects(summary.gqlStatusObjects)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      return {
        success: false,
        message: `${params.player.first_name} ${params.player.last_name} could not be updated.`,
        statusObjects
      }
    }

    return {
      success: true,
      message: `${params.player.first_name} ${params.player.last_name} updated successfully.`,
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
      statusMessage: "Error updating player",
      data: [error instanceof Error ? error.message : String(error)]
    })
  }
})
