import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const { team1Ids, team2Ids } = await readBody(event)

    let query = `/* cypher */
      MATCH (p1:Player {id: $id[0]})-[:REPRESENTS]->(c1:Country)

      WITH
        [x IN labels(p1) WHERE x IN ['ATP', 'WTA']][0] AS p1Tour,
        properties(c1) AS p1Country,
        apoc.map.clean(
          apoc.map.submap(
            p1,
            ['id', 'first_name', 'last_name', 'pm', 'rh', 'bh', 'dob', 'height', 'ch_singles', 'ch_doubles'],
            null,
            false
          ),
          [],
          [null]
        ) AS p1Details,
        p1

      WITH
        apoc.map.merge(
          p1Details,
          { tour: p1Tour, country: p1Country }
        ) As player1,
        p1
    `

    if (team1Ids.length === 2) {
      // If doubles, get second player details and players' doubles entries
      query += `/* cypher */
        MATCH (p2:Player {id: $id[1]})-[:REPRESENTS]->(c2:Country)

        WITH
          player1,
          p1,
          [x IN labels(p2) WHERE x IN ['ATP', 'WTA']][0] AS p2Tour,
          properties(c2) AS p2Country,
          apoc.map.clean(
            apoc.map.submap(
              p2,
              ['id', 'first_name', 'last_name', 'pm', 'rh', 'bh', 'dob', 'height', 'ch_singles', 'ch_doubles'],
              null,
              false
            ),
            [],
            [null]
          ) AS p2Details,
          p2

        WITH
          apoc.map.merge(
            p2Details,
            { tour: p2Tour, country: p2Country }
          ) AS player2,
          player1,
          p1,
          p2

        MATCH (p1)-[:ENTERED]->(f:Doubles)<-[:ENTERED]-(p2)
      `
    } else {
      // Otherwise get players' singles entries
      query += `/* cypher */
        MATCH (p1)-[:ENTERED]->(f:Singles)
      `
    }

    // Match titles and win/losses
    query += `/* cypher */
      OPTIONAL MATCH (f)-[:SCORED]->(:Winner)-[:SCORED]->(t:Match)-[:PLAYED]->(:Round {round: 'Final'})-[:ROUND_OF]->(e:Event)
      OPTIONAL MATCH (f)-[:SCORED]->(s:Score)-[:SCORED]->(:BestOf3|BestOf5)-[:PLAYED]->(:Round)-[:ROUND_OF]->(e1:Event)

      WITH player1,
        COUNT(DISTINCT t) AS titles,
        COUNT(DISTINCT CASE WHEN s:Winner THEN s END) AS wins,
        COUNT(DISTINCT CASE WHEN s:Loser THEN s END) AS losses,
        COUNT(DISTINCT CASE WHEN s:Winner AND e1:Tour THEN s END) AS tour_wins,
        COUNT(DISTINCT CASE WHEN s:Loser AND e1:Tour THEN s END) AS tour_losses,
        COUNT(DISTINCT CASE WHEN e1:Tour THEN t END) AS tour_titles
    `

    if (team1Ids.length === 2) {
      query += `/* cypher */
        , player2

        RETURN {
          titles: titles,
          wins: wins,
          losses: losses,
          tour_wins: tour_wins,
          tour_losses: tour_losses,
          tour_titles: tour_titles,
          players: [player1, player2]
        } AS team
      `
    } else {
      query += `/* cypher */
        RETURN {
          titles: titles,
          wins: wins,
          losses: losses,
          tour_wins: tour_wins,
          tour_losses: tour_losses,
          tour_titles: tour_titles,
          players: [player1]
        } AS team
      `
    }

    const { records: team1Records } = await useDriver().executeQuery(query, { id: team1Ids })

    const { records: team2Records } = await useDriver().executeQuery(query, { id: team2Ids })

    const team1 = team1Records[0].get("team")
    const team2 = team2Records[0].get("team")

    return {
      team1: h2hTeamSchema.parse(team1),
      team2: h2hTeamSchema.parse(team2)
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
