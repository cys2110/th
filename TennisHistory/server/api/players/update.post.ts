export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerFormSchema.parse(body))

    let query = `/* cypher */
    MATCH (p:Player {id: $id})
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
        MATCH (c:Country {id: $country.name})
        MERGE (p)-[v1:REPRESENTS]->(c)
        SET v1.start_date = coalesce($country.start_date, null)
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
        MATCH (c:Country {id: k.name})
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
        MATCH (c:Coach {id: k.name})
        MERGE (c)-[v1:COACHES]->(p)
        SET v1.years = coalesce(k.years, null)
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
        MATCH (c:Coach {id: k.name})
        MERGE (c)-[v1:COACHED]->(p)
        SET v1.years = coalesce(k.years, null)
      `
      }
    }

    const { summary } = await useDriver().executeQuery(query, params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      return {
        success: false,
        message: `${params.player.first_name} ${params.player.last_name} could not be found.`
      }
    } else {
      return { success: true }
    }
  } catch (error) {
    throw error
  }
})
