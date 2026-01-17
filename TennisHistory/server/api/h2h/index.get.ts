import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const playerQuery = `/* cypher */
      WITH range(1, 10) AS ranks
      UNWIND ranks AS rank
      MATCH (p:Player:$($tour) {current_singles: rank})-[:REPRESENTS]->(c:Country)
      RETURN {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        country: properties(c),
        current_singles: p.current_singles
      } AS player
      ORDER BY p.current_singles
    `

    const { records: atpPlayerRecords } = await useDriver().executeQuery(playerQuery, { tour: "ATP" })
    const { records: wtaPlayerRecords } = await useDriver().executeQuery(playerQuery, { tour: "WTA" })

    const h2hQuery = `/* cypher */
      WITH range(1, 10) AS ranks
      UNWIND ranks AS rank
      MATCH (p:Player:$($tour) {current_singles: rank})

      WITH p, ranks
      UNWIND ranks AS rank
      MATCH (o:Player:$($tour) {current_singles: rank})

      MATCH
        (p)-[:ENTERED]->
        (:Singles)-[:SCORED]->
        (s:Score)-[:SCORED]->
        (:BestOf3|BestOf5)<-[:SCORED]-
        (:Score)<-[:SCORED]-
        (:Entry)<-[:ENTERED]-(o)

      WITH
        p.id AS player,
        o.id AS opponent,
        p,
        o,
        SUM(CASE WHEN s:Winner THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN s:Loser THEN 1 ELSE 0 END) AS losses
      ORDER BY p.current_singles, o.current_singles

      WITH player, collect({opponent: opponent, wins: wins, losses: losses}) AS h2hList

      WITH player,
          reduce(m = {player: player}, h IN h2hList |
            apoc.map.setKey(
              m,
              toString(h.opponent),
              toString(h.wins) + '-' + toString(h.losses)
            )
          ) AS row
      RETURN row AS h2h
    `

    const { records: atpH2HRecords } = await useDriver().executeQuery(h2hQuery, { tour: "ATP" })
    const { records: wtaH2HRecords } = await useDriver().executeQuery(h2hQuery, { tour: "WTA" })

    const atpPlayers = atpPlayerRecords.map(record => {
      const player = record.get("player")
      return h2hPlayerSchema.parse(player)
    })

    const wtaPlayers = wtaPlayerRecords.map(record => {
      const player = record.get("player")
      return h2hPlayerSchema.parse(player)
    })

    const atpResults = atpH2HRecords.map(record => {
      const h2h = record.get("h2h")
      return h2hBaseSchema.parse(h2h)
    })

    const wtaResults = wtaH2HRecords.map(record => {
      const h2h = record.get("h2h")
      return h2hBaseSchema.parse(h2h)
    })

    return {
      atpPlayers,
      atpResults,
      wtaPlayers,
      wtaResults
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
