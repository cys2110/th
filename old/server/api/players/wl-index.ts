export default defineEventHandler(async query => {
  const { id } = getQuery(query)
  const currentYear = new Date().getFullYear()

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    OPTIONAL MATCH (p:Player {id: $id})-[:ENTERED]->(f:Entry:Singles)-[:SCORED]->(s:Score)-[:SCORED]->(m:Match)-[:PLAYED]->(r:Round)-[:ROUND_OF]->(e:Event)-[:IN_YEAR]->(y:Year)
    OPTIONAL MATCH (e:Event)-[:ON_SURFACE]->(z:Surface)
    OPTIONAL MATCH (p1:Player WHERE p1.id <> p.id)-[:ENTERED]->(f1:Entry)-[:SCORED]->(s1:Score)-[:SCORED]->(m)
    WITH [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour, z.surface AS surface, apoc.map.merge(apoc.map.submap(s1, ['s1', 's2', 's3', 's4', 's5'], null, false), {rh: p1.rh, rank: f1.rank}) AS opponent, apoc.map.submap(s, ['s1', 's2', 's3', 's4', 's5'], null, false) AS score, r.round AS round, labels(m) AS labels, y.id AS year, apoc.map.submap(e, ['category', 'atp_category', 'wta_category'], null, false) AS categories, CASE WHEN s:Winner THEN true ELSE false END AS win, z.environment AS environment
    RETURN {
      tour: tour,
      surface: surface,
      opponent: opponent,
      score: score,
      round: round,
      labels: labels,
      year: year,
      categories: categories,
      win: win,
      environment: environment
    } AS match
    `,
    { id }
  )

  const results = records.map((record: any) => {
    const match = record.get("match")
    const numberKeys = ["s1", "s2", "s3", "s4", "s5", "s6", "rank"]

    for (const key of numberKeys) {
      if (match.score[key]) match.score[key] = match.score[key].toInt()
      if (match.opponent[key]) match.opponent[key] = match.opponent[key].toInt()
    }

    if (match.year) match.year = match.year.toInt()

    let bagelsWon = 0
    let bagelsLost = 0
    let breadsticksWon = 0
    let breadsticksLost = 0
    let tiebreaksWon = 0
    let tiebreaksLost = 0

    const scores = ["s1", "s2", "s3", "s4", "s5"]

    for (const score of scores) {
      if (match.score[score] || match.opponent[score]) {
        if (match.score[score] === 7 && match.opponent[score] === 6) {
          tiebreaksWon++
        } else if (match.score[score] === 6 && match.opponent[score] === 7) {
          tiebreaksLost++
        } else if (match.score[score] === 6 && match.opponent[score] === 0) {
          bagelsWon++
        } else if (match.score[score] === 0 && match.opponent[score] === 6) {
          bagelsLost++
        } else if (match.score[score] === 6 && match.opponent[score] === 1) {
          breadsticksWon++
        } else if (match.score[score] === 1 && match.opponent[score] === 6) {
          breadsticksLost++
        }
      }
    }

    return {
      level:
        match.labels.includes("Men") || match.labels.includes("Women")
          ? "ITF"
          : (match.tour === "ATP" && ATP_CHALLENGER_CATEGORIES.includes(match.categories.atp_category)) ||
            (match.tour === "WTA" && WTA_CHALLENGER_CATEGORIES.includes(match.categories.wta_category))
          ? "Challenger"
          : "Tour",
      draw: match.labels.includes("Qualifying") ? "Qualifying" : "Main",
      ytd: match.year === currentYear,
      win: match.win,
      round: match.round,
      category:
        match.categories.category === "Grand Slam"
          ? "Grand Slam"
          : MASTERS_CATEGORIES.includes(match.categories.atp_category) || MASTERS_CATEGORIES.includes(match.categories.wta_category)
          ? "Masters"
          : "Overall",
      surface: match.surface,
      top10: match.opponent.rank && match.opponent.rank <= 10,
      rh: match.opponent.rh,
      lh: match.opponent.rh === false,
      won1: match.score.s1 > match.opponent.s1,
      lost1: match.score.s1 < match.opponent.s1,
      decidingSet: (match.labels.includes("Best3") && match.score.s3) || (match.labels.includes("Best5") && match.score.s5),
      set5: match.labels.includes("Best5") && match.score.s5,
      bagelsWon,
      bagelsLost,
      breadsticksWon,
      breadsticksLost,
      tiebreaksWon,
      tiebreaksLost,
      environment: match.environment
    }
  })

  const levels = ["Tour", "Challenger", "ITF"]
  const draws = ["Main", "Qualifying"]
  const surfaces = ["Clay", "Grass", "Hard", "Carpet"]
  const environments = ["Indoor", "Outdoor"]

  const index = [
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Match Record",
          stat: "Overall",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.win ? sum + 1 : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && !r.win ? sum + 1 : sum), 0),
          titles: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.win && r.round === "Final" ? sum + 1 : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.win && r.ytd ? sum + 1 : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && !r.win && r.ytd ? sum + 1 : sum), 0),
          ytd_titles: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.win && r.round === "Final" && r.ytd ? sum + 1 : sum), 0)
        }))
      )
      .flat(),
    {
      level: "Tour",
      draw: "Main",
      category: "Match Record",
      stat: "Grand Slams",
      wins: results.reduce((sum, r) => (r.category === "Grand Slam" && r.win ? sum + 1 : sum), 0),
      losses: results.reduce((sum, r) => (r.category === "Grand Slam" && !r.win ? sum + 1 : sum), 0),
      titles: results.reduce((sum, r) => (r.category === "Grand Slam" && r.win && r.round === "Final" ? sum + 1 : sum), 0),
      ytd_wins: results.reduce((sum, r) => (r.category === "Grand Slam" && r.win && r.ytd ? sum + 1 : sum), 0),
      ytd_losses: results.reduce((sum, r) => (r.category === "Grand Slam" && !r.win && r.ytd ? sum + 1 : sum), 0),
      ytd_titles: results.reduce((sum, r) => (r.category === "Grand Slam" && r.win && r.round === "Final" && r.ytd ? sum + 1 : sum), 0)
    },
    {
      level: "Tour",
      draw: "Main",
      category: "Match Record",
      stat: "Masters",
      wins: results.reduce((sum, r) => (r.category === "Masters" && r.win ? sum + 1 : sum), 0),
      losses: results.reduce((sum, r) => (r.category === "Masters" && !r.win ? sum + 1 : sum), 0),
      titles: results.reduce((sum, r) => (r.category === "Masters" && r.win && r.round === "Final" ? sum + 1 : sum), 0),
      ytd_wins: results.reduce((sum, r) => (r.category === "Masters" && r.win && r.ytd ? sum + 1 : sum), 0),
      ytd_losses: results.reduce((sum, r) => (r.category === "Masters" && !r.win && r.ytd ? sum + 1 : sum), 0),
      ytd_titles: results.reduce((sum, r) => (r.category === "Masters" && r.win && r.round === "Final" && r.ytd ? sum + 1 : sum), 0)
    },
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Pressure Points",
          stat: "Tie Breaks",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw ? sum + r.tiebreaksWon : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw ? sum + r.tiebreaksLost : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.ytd ? sum + r.tiebreaksWon : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.ytd ? sum + r.tiebreaksLost : sum), 0)
        }))
      )
      .flat(),
    ...levels.map(level => ({
      level,
      draw: "Main",
      category: "Pressure Points",
      stat: "Finals",
      wins: results.reduce((sum, r) => (r.level === level && r.draw === "Main" && r.round === "Final" && r.win ? sum + 1 : sum), 0),
      losses: results.reduce((sum, r) => (r.level === level && r.draw === "Main" && r.round === "Final" && !r.win ? sum + 1 : sum), 0),
      ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === "Main" && r.round === "Final" && r.win && r.ytd ? sum + 1 : sum), 0),
      ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === "Main" && r.round === "Final" && !r.win && r.ytd ? sum + 1 : sum), 0)
    })),
    {
      level: "Tour",
      draw: "Main",
      category: "Pressure Points",
      stat: "Versus Top 10",
      wins: results.reduce((sum, r) => (r.top10 && r.win ? sum + 1 : sum), 0),
      losses: results.reduce((sum, r) => (r.top10 && !r.win ? sum + 1 : sum), 0),
      ytd_wins: results.reduce((sum, r) => (r.top10 && r.win && r.ytd ? sum + 1 : sum), 0),
      ytd_losses: results.reduce((sum, r) => (r.top10 && !r.win && r.ytd ? sum + 1 : sum), 0)
    },
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Pressure Points",
          stat: "Deciding Set",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.decidingSet && r.win ? sum + 1 : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.decidingSet && !r.win ? sum + 1 : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.decidingSet && r.win && r.ytd ? sum + 1 : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.decidingSet && !r.win && r.ytd ? sum + 1 : sum), 0)
        }))
      )
      .flat(),
    {
      level: "Tour",
      draw: "Main",
      category: "Pressure Points",
      stat: "5th Set Record",
      wins: results.reduce((sum, r) => (r.set5 && r.win ? sum + 1 : sum), 0),
      losses: results.reduce((sum, r) => (r.set5 && !r.win ? sum + 1 : sum), 0),
      ytd_wins: results.reduce((sum, r) => (r.set5 && r.win && r.ytd ? sum + 1 : sum), 0),
      ytd_losses: results.reduce((sum, r) => (r.set5 && !r.win && r.ytd ? sum + 1 : sum), 0)
    },
    ...levels
      .map(level =>
        draws
          .map(draw =>
            surfaces.map(surface => ({
              level,
              draw,
              category: "Environment",
              stat: surface,
              wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.surface === surface && r.win ? sum + 1 : sum), 0),
              losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.surface === surface && !r.win ? sum + 1 : sum), 0),
              titles: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.surface === surface && r.win && r.round === "Final" ? sum + 1 : sum),
                0
              ),
              ytd_wins: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.surface === surface && r.win && r.ytd ? sum + 1 : sum),
                0
              ),
              ytd_losses: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.surface === surface && !r.win && r.ytd ? sum + 1 : sum),
                0
              ),
              ytd_titles: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.surface === surface && r.win && r.round === "Final" && r.ytd ? sum + 1 : sum),
                0
              )
            }))
          )
          .flat()
      )
      .flat(),
    ...levels
      .map(level =>
        draws
          .map(draw =>
            environments.map(env => ({
              level,
              draw,
              category: "Environment",
              stat: env,
              wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.environment === env && r.win ? sum + 1 : sum), 0),
              losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.environment === env && !r.win ? sum + 1 : sum), 0),
              titles: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.environment === env && r.win && r.round === "Final" ? sum + 1 : sum),
                0
              ),
              ytd_wins: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.environment === env && r.win && r.ytd ? sum + 1 : sum),
                0
              ),
              ytd_losses: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.environment === env && !r.win && r.ytd ? sum + 1 : sum),
                0
              ),
              ytd_titles: results.reduce(
                (sum, r) => (r.level === level && r.draw === draw && r.environment === env && r.win && r.round === "Final" && r.ytd ? sum + 1 : sum),
                0
              )
            }))
          )
          .flat()
      )
      .flat(),
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Other",
          stat: "After Winning 1st Set",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.won1 && r.win ? sum + 1 : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.won1 && !r.win ? sum + 1 : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.won1 && r.win && r.ytd ? sum + 1 : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.won1 && !r.win && r.ytd ? sum + 1 : sum), 0)
        }))
      )
      .flat(),
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Other",
          stat: "After Losing 1st Set",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lost1 && r.win ? sum + 1 : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lost1 && !r.win ? sum + 1 : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lost1 && r.win && r.ytd ? sum + 1 : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lost1 && !r.win && r.ytd ? sum + 1 : sum), 0)
        }))
      )
      .flat(),
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Other",
          stat: "Vs. Right-Handers",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.rh && r.win ? sum + 1 : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.rh && !r.win ? sum + 1 : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.rh && r.win && r.ytd ? sum + 1 : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.rh && !r.win && r.ytd ? sum + 1 : sum), 0)
        }))
      )
      .flat(),
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Other",
          stat: "Vs. Left-Handers",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lh && r.win ? sum + 1 : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lh && !r.win ? sum + 1 : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lh && r.win && r.ytd ? sum + 1 : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.lh && !r.win && r.ytd ? sum + 1 : sum), 0)
        }))
      )
      .flat(),
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Other",
          stat: "Bagels",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw ? sum + r.bagelsWon : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw ? sum + r.bagelsLost : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.ytd ? sum + r.bagelsWon : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.ytd ? sum + r.bagelsLost : sum), 0)
        }))
      )
      .flat(),
    ...levels
      .map(level =>
        draws.map(draw => ({
          level,
          draw,
          category: "Other",
          stat: "Breadsticks",
          wins: results.reduce((sum, r) => (r.level === level && r.draw === draw ? sum + r.breadsticksWon : sum), 0),
          losses: results.reduce((sum, r) => (r.level === level && r.draw === draw ? sum + r.breadsticksLost : sum), 0),
          ytd_wins: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.ytd ? sum + r.breadsticksWon : sum), 0),
          ytd_losses: results.reduce((sum, r) => (r.level === level && r.draw === draw && r.ytd ? sum + r.breadsticksLost : sum), 0)
        }))
      )
      .flat()
  ]

  return index.map(i => ({
    ...i,
    value: i.losses === 0 ? 0 : i.wins / (i.wins + i.losses),
    ytd_value: i.ytd_losses === 0 ? 0 : i.ytd_wins / (i.ytd_wins + i.ytd_losses)
  }))
})
