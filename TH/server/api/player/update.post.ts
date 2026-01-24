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
          SET v1.start_date = $country.start_date
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
          SET v1.start_date = k.start_date, v1.end_date = k.end_date
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
          SET v1.years = k.years
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
          SET v1.years = k.years
        `
      }
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 404,
        statusMessage: `${params.player.first_name} ${params.player.last_name} could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${params.player.first_name} ${params.player.last_name} could not be updated`
      })
    } else {
      return true
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
