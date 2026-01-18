import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => wlIndexQuerySchema.parse(body))

    const { records } = await useDriver().executeQuery(
      `/* cypher */
        OPTIONAL MATCH
          (p:Player {id: $id})-[:ENTERED]->
          (:Entry:Singles)-[:SCORED]->
          (s:Score)-[:SCORED]->
          (m:Match)-[:PLAYED]->
          (r:Round)-[:ROUND_OF]->
          (e:Event)-[:EVENT_OF]->
          (ed:Edition)-[:IN_YEAR]->
          (y:Year WHERE SIZE($years) = 0 OR y.id IN $years)
        OPTIONAL MATCH (e)-[:ON_SURFACE]->(z:Surface)
        OPTIONAL MATCH (ed)-[:ON_SURFACE]->(edz:Surface)
        OPTIONAL MATCH (p1:Player WHERE p1.id <> p.id)-[t:ENTERED]->(:Entry)-[:SCORED]->(s1:Score)-[:SCORED]->(m)

        WITH
          s,
          m,
          r,
          e,
          ed,
          y,
          p1,
          s1,
          t,
          coalesce(z, edz) AS surface
        WHERE
          (SIZE($levels) = 0 OR ANY(x IN $levels WHERE x IN labels(e))) AND
          ($drawType IS NULL OR $drawType in labels(m))

        WITH
          apoc.map.merge(apoc.map.submap(s1, ['s1', 's2', 's3', 's4', 's5'], null, false), {rh: p1.rh, rank: t.rank}) AS opponent,
          apoc.map.submap(s, ['s1', 's2', 's3', 's4', 's5'], null, false) AS score,
          r.round AS round,
          CASE WHEN m:BestOf3 THEN 3 ELSE 5 END AS noOfSets,
          y.id AS year,
          coalesce(e.category, ed.category) AS category,
          CASE WHEN s:Winner THEN true ELSE false END AS win,
          properties(surface) AS surface
        RETURN {
          surface: surface,
          opponent: opponent,
          score: score,
          round: round,
          noOfSets: noOfSets,
          year: year,
          category: category,
          win: win
        } AS match
      `,
      params
    )

    const results = records.map((record: any) => {
      const match = record.get("match")

      return wlIndexMatchSchema.parse(match)
    })

    const mastersCategories = [
      "ATP Masters 1000",
      "ATP Masters Series",
      "ATP Super 9",
      "ATP Championship Series, Single Week",
      "Premier Mandatory",
      "WTA 1000"
    ]

    const index = [
      {
        category: "Match record",
        stat: "Overall",
        wins: results.filter(r => r.win).length,
        losses: results.filter(r => !r.win).length,
        titles: results.filter(r => r.win && r.round === "Final").length
      },
      {
        category: "Match record",
        stat: "Grand Slams",
        wins: results.filter(r => r.win && r.category === "Grand Slam").length,
        losses: results.filter(r => !r.win && r.category === "Grand Slam").length,
        titles: results.filter(r => r.win && r.round === "Final" && r.category === "Grand Slam").length
      },
      {
        category: "Match record",
        stat: "Masters",
        wins: results.filter(r => r.win && r.category && mastersCategories.includes(r.category)).length,
        losses: results.filter(r => !r.win && r.category && mastersCategories.includes(r.category)).length,
        titles: results.filter(r => r.win && r.round === "Final" && r.category && mastersCategories.includes(r.category)).length
      },
      {
        category: "Pressure points",
        stat: "Tie breaks",
        wins: results.reduce((acc, r) => {
          let matchTiebreaks = 0
          if (r.score.s1 === 7 && r.opponent.s1 === 6) matchTiebreaks++
          if (r.score.s2 === 7 && r.opponent.s2 === 6) matchTiebreaks++
          if (r.score.s3 === 7 && r.opponent.s3 === 6) matchTiebreaks++
          if (r.score.s4 === 7 && r.opponent.s4 === 6) matchTiebreaks++
          if (r.score.s5 === 7 && r.opponent.s5 === 6) matchTiebreaks++
          return acc + matchTiebreaks
        }, 0),
        losses: results.reduce((acc, r) => {
          let matchTiebreaks = 0
          if (r.score.s1 === 6 && r.opponent.s1 === 7) matchTiebreaks++
          if (r.score.s2 === 6 && r.opponent.s2 === 7) matchTiebreaks++
          if (r.score.s3 === 6 && r.opponent.s3 === 7) matchTiebreaks++
          if (r.score.s4 === 6 && r.opponent.s4 === 7) matchTiebreaks++
          if (r.score.s5 === 6 && r.opponent.s5 === 7) matchTiebreaks++
          return acc + matchTiebreaks
        }, 0)
      },
      {
        category: "Pressure points",
        stat: "Versus Top 10",
        wins: results.filter(r => r.win && r.opponent.rank && r.opponent.rank <= 10).length,
        losses: results.filter(r => !r.win && r.opponent.rank && r.opponent.rank <= 10).length
      },
      {
        category: "Pressure points",
        stat: "Finals",
        wins: results.filter(r => r.win && r.round === "Final").length,
        losses: results.filter(r => !r.win && r.round === "Final").length
      },
      {
        category: "Pressure points",
        stat: "Deciding set",
        wins: results.filter(r => {
          if (r.noOfSets === 3 && r.win && r.score.s3) return true
          if (r.noOfSets === 5 && r.win && r.score.s5) return true
          return false
        }).length,
        losses: results.filter(r => {
          if (r.noOfSets === 3 && !r.win && r.score.s3) return true
          if (r.noOfSets === 5 && !r.win && r.score.s5) return true
          return false
        }).length
      },
      {
        category: "Pressure points",
        stat: "5th set record",
        wins: results.filter(r => r.noOfSets === 5 && r.win && r.score.s5).length,
        losses: results.filter(r => r.noOfSets === 5 && !r.win && r.score.s5).length
      },
      {
        category: "Environment",
        stat: "Clay",
        wins: results.filter(r => r.win && r.surface.surface === "Clay").length,
        losses: results.filter(r => !r.win && r.surface.surface === "Clay").length,
        titles: results.filter(r => r.win && r.round === "Final" && r.surface.surface === "Clay").length
      },
      {
        category: "Environment",
        stat: "Grass",
        wins: results.filter(r => r.win && r.surface.surface === "Grass").length,
        losses: results.filter(r => !r.win && r.surface.surface === "Grass").length,
        titles: results.filter(r => r.win && r.round === "Final" && r.surface.surface === "Grass").length
      },
      {
        category: "Environment",
        stat: "Hard",
        wins: results.filter(r => r.win && r.surface.surface === "Hard").length,
        losses: results.filter(r => !r.win && r.surface.surface === "Hard").length,
        titles: results.filter(r => r.win && r.round === "Final" && r.surface.surface === "Hard").length
      },
      {
        category: "Environment",
        stat: "Carpet",
        wins: results.filter(r => r.win && r.surface.surface === "Carpet").length,
        losses: results.filter(r => !r.win && r.surface.surface === "Carpet").length,
        titles: results.filter(r => r.win && r.round === "Final" && r.surface.surface === "Carpet").length
      },
      {
        category: "Environment",
        stat: "Indoor",
        wins: results.filter(r => r.win && r.surface.environment === "Indoor").length,
        losses: results.filter(r => !r.win && r.surface.environment === "Indoor").length,
        titles: results.filter(r => r.win && r.round === "Final" && r.surface.environment === "Indoor").length
      },
      {
        category: "Environment",
        stat: "Outdoor",
        wins: results.filter(r => r.win && r.surface.environment === "Outdoor").length,
        losses: results.filter(r => !r.win && r.surface.environment === "Outdoor").length,
        titles: results.filter(r => r.win && r.round === "Final" && r.surface.environment === "Outdoor").length
      },
      {
        category: "Other",
        stat: "After winning 1st set",
        wins: results.filter(r => r.win && r.score.s1 && r.opponent.s1 && r.score.s1 > r.opponent.s1).length,
        losses: results.filter(r => !r.win && r.score.s1 && r.opponent.s1 && r.score.s1 > r.opponent.s1).length
      },
      {
        category: "Other",
        stat: "After losing 1st set",
        wins: results.filter(r => r.win && r.score.s1 && r.opponent.s1 && r.score.s1 < r.opponent.s1).length,
        losses: results.filter(r => !r.win && r.score.s1 && r.opponent.s1 && r.score.s1 < r.opponent.s1).length
      },
      {
        category: "Other",
        stat: "Versus right-handers",
        wins: results.filter(r => r.win && r.opponent.rh === "Right").length,
        losses: results.filter(r => !r.win && r.opponent.rh === "Right").length
      },
      {
        category: "Other",
        stat: "Versus left-handers",
        wins: results.filter(r => r.win && r.opponent.rh === "Left").length,
        losses: results.filter(r => !r.win && r.opponent.rh === "Left").length
      },
      {
        category: "Other",
        stat: "Bagels",
        wins: results.reduce((acc, r) => {
          let matchBagels = 0
          if (r.score.s1 === 6 && r.opponent.s1 === 0) matchBagels++
          if (r.score.s2 === 6 && r.opponent.s2 === 0) matchBagels++
          if (r.score.s3 === 6 && r.opponent.s3 === 0) matchBagels++
          if (r.score.s4 === 6 && r.opponent.s4 === 0) matchBagels++
          if (r.score.s5 === 6 && r.opponent.s5 === 0) matchBagels++
          return acc + matchBagels
        }, 0),
        losses: results.reduce((acc, r) => {
          let matchBagels = 0
          if (r.score.s1 === 0 && r.opponent.s1 === 6) matchBagels++
          if (r.score.s2 === 0 && r.opponent.s2 === 6) matchBagels++
          if (r.score.s3 === 0 && r.opponent.s3 === 6) matchBagels++
          if (r.score.s4 === 0 && r.opponent.s4 === 6) matchBagels++
          if (r.score.s5 === 0 && r.opponent.s5 === 6) matchBagels++
          return acc + matchBagels
        }, 0)
      },
      {
        category: "Other",
        stat: "Breadsticks",
        wins: results.reduce((acc, r) => {
          let matchBreadsticks = 0
          if (r.score.s1 === 6 && r.opponent.s1 === 1) matchBreadsticks++
          if (r.score.s2 === 6 && r.opponent.s2 === 1) matchBreadsticks++
          if (r.score.s3 === 6 && r.opponent.s3 === 1) matchBreadsticks++
          if (r.score.s4 === 6 && r.opponent.s4 === 1) matchBreadsticks++
          if (r.score.s5 === 6 && r.opponent.s5 === 1) matchBreadsticks++
          return acc + matchBreadsticks
        }, 0),
        losses: results.reduce((acc, r) => {
          let matchBreadsticks = 0
          if (r.score.s1 === 1 && r.opponent.s1 === 6) matchBreadsticks++
          if (r.score.s2 === 1 && r.opponent.s2 === 6) matchBreadsticks++
          if (r.score.s3 === 1 && r.opponent.s3 === 6) matchBreadsticks++
          if (r.score.s4 === 1 && r.opponent.s4 === 6) matchBreadsticks++
          if (r.score.s5 === 1 && r.opponent.s5 === 6) matchBreadsticks++
          return acc + matchBreadsticks
        }, 0)
      }
    ]

    return index.map(i => ({
      ...i,
      value: i.wins + i.losses === 0 ? 0 : i.wins / (i.wins + i.losses)
    }))
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
