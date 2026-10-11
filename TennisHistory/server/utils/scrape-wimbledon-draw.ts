import type { SupabaseClient } from "@supabase/supabase-js"
import { Browser, chromium } from "playwright"
import type { Database } from "~/types/database.types"

type EntryInsert = Database["tennis"]["Tables"]["entries"]["Insert"]
type ScoreInsert = Database["tennis"]["Tables"]["match_scores"]["Insert"]
type StatsInsert = Database["tennis"]["Tables"]["match_stats"]["Insert"]
type IncompleteEnum = Database["tennis"]["Enums"]["incomplete_enum"]

interface PlayerInterface {
  id: string
  name: string
  tour: string
}

interface TeamInterface {
  entry_key: string
  players: string[]
}

interface ScoreInterface {
  set: number
  set_no: number
  tb?: number
}

interface MatchInterface {
  match_no: number
  date: string
  court: string
  round: string
  tour: "ATP" | "WTA"
  draw: "Main" | "Qualifying"
  match_type: "Singles" | "Doubles"
  format: 3 | 5
  duration: string
  match_link: string
  t1: TeamInterface
  t2: TeamInterface
  t1_scores: ScoreInterface[]
  t2_scores: ScoreInterface[]
  incomplete?: IncompleteEnum
  winner?: number
  stats?: any
}

const draws = {
  "Ladies' Singles": {
    id: "ladies-singles",
    tour: "WTA",
    draw: "Main",
    match_type: "Singles"
  },
  "Gentlemen's Singles": {
    id: "gentlemens-singles",
    tour: "ATP",
    draw: "Main",
    match_type: "Singles"
  },
  "Ladies' Doubles": {
    id: "ladies-doubles",
    tour: "WTA",
    draw: "Main",
    match_type: "Doubles"
  },
  "Gentlemen's Doubles": {
    id: "gentlemens-doubles",
    tour: "ATP",
    draw: "Main",
    match_type: "Doubles"
  },
  "Ladies' Qualifying Singles": {
    id: "l-qualifying-singles",
    tour: "WTA",
    draw: "Qualifying",
    match_type: "Singles"
  },
  "Gentlemen's Qualifying Singles": {
    id: "g-qualifying-singles",
    tour: "ATP",
    draw: "Qualifying",
    match_type: "Singles"
  }
} as const

const incompleteMapping: Record<string, IncompleteEnum> = {
  "RET.": "R",
  "W/O": "WO"
}

export async function scrapeWimbledonDraw(supabase: SupabaseClient<Database>, year: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const { data: edition, error: editionError } = await supabase
      .schema("tennis")
      .from("editions")
      .select("tournament!inner(id), events(id, tour, rounds(*))")
      .eq("tournament.mens_id", 540)
      .eq("year", Number(year))
      .single()

    if (editionError || !edition) {
      console.error("Error fetching edition:", editionError)
      return {
        success: false,
        error: "Error fetching edition"
      }
    }

    // Verify that all players are in the database. If any players are not in the database, write to json
    const allPlayers = await fetchEntries(browser)

    const verifyPlayersResult = await verifyExistingPlayers(supabase, Object.fromEntries(allPlayers.map(p => [p.id, p.name])))

    if (!verifyPlayersResult.success) {
      return {
        success: false,
        error: "Error checking existing players"
      }
    } else if (verifyPlayersResult.count) {
      return {
        success: false,
        error: "Missing players",
        missingPlayers: verifyPlayersResult.playersNotInSupabase
      }
    }

    const matches = await scrapeResultsPage(browser, year)

    const entries: Record<string, EntryInsert & { players: string[] }> = {}

    matches.forEach(match => {
      const event = edition.events.find(e => e.tour === match.tour)

      if (!event) {
        console.error("Event not found:", match)
        return
      }

      const teams = [match.t1, match.t2]

      teams.forEach(team => {
        entries[team.entry_key] = {
          match_type: match.match_type,
          event_id: event.id,
          entry_key: team.entry_key,
          players: team.players
        }
      })
    })

    const { data: insertedEntries, error: insertedEntriesError } = await supabase
      .schema("tennis")
      .from("entries")
      .upsert(
        Object.values(entries).map(e => {
          const { players, ...rest } = e

          return rest
        }),
        { onConflict: "event_id,entry_key" }
      )
      .select("*")

    if (insertedEntriesError || !insertedEntries) {
      console.error("Error inserting entries:", insertedEntriesError)
      return {
        success: false,
        error: "Error inserting entries"
      }
    }

    // Player entry mapping
    const playerMappings = insertedEntries.flatMap(e => {
      const entry = entries[e.entry_key as keyof typeof entries]

      if (!entry) {
        console.error("Entry not found:", e)
        return []
      }

      return entry?.players.map((p, index) => ({
        player_id: p,
        entry_id: e.id,
        player_order: index + 1
      }))
    })

    const { error: pemError } = await supabase
      .schema("tennis")
      .from("player_entry_mapping")
      .upsert(playerMappings, { onConflict: "player_id,entry_id" })

    if (pemError) {
      console.error("Error inserting player entry mapping:", pemError)

      if (pemError.code === "23503") {
        const nonErrors = await verifyExistingPlayers(supabase, Object.fromEntries(playerMappings.map(p => [p.player_id, p.entry_id])))

        if (!verifyPlayersResult.success) {
          return {
            success: false,
            error: "Error checking existing players"
          }
        } else if (verifyPlayersResult.count) {
          return {
            success: false,
            error: "Missing players",
            missingPlayers: verifyPlayersResult.playersNotInSupabase,
            matches
          }
        }
      }

      return {
        success: false,
        error: "Error inserting player entry mapping"
      }
    }

    const matchesToInsert = matches.map(match => {
      const { t1, t2, t1_scores, t2_scores, round, winner, stats, ...rest } = match

      const eventRound = edition.events
        .find(e => e.tour === match.tour)!
        .rounds.find(r => r.round === round && r.draw === match.draw && r.match_type === match.match_type)

      if (!eventRound) {
        console.error("Round not found:", match)
      }

      const round_id = eventRound!.id

      const team_1_id = insertedEntries.find(e => e.entry_key === t1.entry_key)!.id
      const team_2_id = insertedEntries.find(e => e.entry_key === t2.entry_key)!.id

      return {
        ...rest,
        round_id,
        team_1_id,
        team_2_id,
        winner_id: winner === 1 ? team_1_id : team_2_id,
        loser_id: winner === 2 ? team_1_id : team_2_id
      }
    })

    // Matches
    const { data: insertedMatches, error: insertedMatchesError } = await supabase.schema("tennis").from("matches").insert(matchesToInsert).select("*")

    if (insertedMatchesError || !insertedMatches) {
      console.error("Error inserting matches:", insertedMatchesError)
      return {
        success: false,
        error: "Error inserting matches"
      }
    }

    // Match Scores / Stats
    const scores: Array<ScoreInsert> = []
    const stats: Array<StatsInsert> = []

    matches.forEach(m => {
      const { t1_scores, t2_scores, stats: matchStats } = m
      const match = insertedMatches.find(im => im.match_link === m.match_link)

      if (!match) {
        console.error("Match not found:", m)
        return
      }

      t1_scores.forEach(score =>
        scores.push({
          match_id: match.id,
          entry_id: match.team_1_id!,
          set_no: score.set_no,
          set: score.set,
          tb: score.tb
        })
      )

      t2_scores.forEach(score =>
        scores.push({
          match_id: match.id,
          entry_id: match.team_2_id!,
          set_no: score.set_no,
          set: score.set,
          tb: score.tb
        })
      )

      const statsKeys = Object.keys(matchStats)

      stats.push({
        match_id: match.id,
        entry_id: match.team_1_id!,
        ...Object.fromEntries(statsKeys.map(k => [k, matchStats[k as keyof typeof matchStats]["t1"]]))
      })

      stats.push({
        match_id: match.id,
        entry_id: match.team_2_id!,
        ...Object.fromEntries(statsKeys.map(k => [k, matchStats[k as keyof typeof matchStats]["t2"]]))
      })
    })

    const { error: matchScoresError } = await supabase.schema("tennis").from("match_scores").insert(scores)
    const { error: matchStatsError } = await supabase.schema("tennis").from("match_stats").insert(stats)

    if (matchScoresError || matchStatsError) {
      console.error(`Error inserting match ${matchScoresError ? "scores" : "stats"}:`, matchScoresError || matchStatsError)
      return {
        success: false,
        error: `Error inserting match ${matchScoresError ? "scores" : "stats"}`
      }
    }

    return {
      success: true,
      matches
    }
  } finally {
    await browser.close()
  }
}

const fetchEntries = async (browser: Browser) => {
  const page = await browser.newPage()

  const allPlayers: Array<PlayerInterface> = []
  const nonRelevantEventPlayers = {}

  try {
    await page.goto("https://www.wimbledon.com/en_GB/players", { waitUntil: "domcontentloaded" })

    await acceptAtpCookies(page)

    const playerCards = await page.locator(".players-list-page__grid").locator(".player-card").all()

    // Fetch all players from all events
    for (const playerCard of playerCards) {
      const link = await playerCard.getAttribute("href")
      const playerName = await playerCard.locator(".player-name__name").innerText()

      if (!link) continue

      const slug = link.split("/").pop()

      if (!slug) continue

      const tour = slug.includes("wta") ? "WTA" : "ATP"

      const playerId = slug.replace("wta", "").replace("atp", "")

      if (playerId in nonRelevantEventPlayers) continue

      allPlayers.push({
        id: playerId,
        name: playerName,
        tour
      })
    }

    return allPlayers
  } finally {
    await page.close()
  }
}

const scrapeResultsPage = async (browser: Browser, year: string) => {
  const page = await browser.newPage()

  const singlesRoundMapping = {
    Final: "Final",
    "Semi-Finals": "Semifinals",
    "Quarter-Finals": "Quarterfinals",
    "Fourth Round": "Round of 16",
    "Third Round": "Round of 32",
    "Second Round": "Round of 64",
    "First Round": "Round of 128"
  }

  const doublesRoundMapping = {
    Final: "Final",
    "Semi-Finals": "Semifinals",
    "Quarter-Finals": "Quarterfinals",
    "Third Round": "Round of 16",
    "Second Round": "Round of 32",
    "First Round": "Round of 64"
  }

  const qualifyingRoundMapping = {
    "Third Round": "Qualifying round 3",
    "Second Round": "Qualifying round 2",
    "First Round": "Qualifying round 1"
  }

  try {
    await page.goto("https://www.wimbledon.com/en_GB/scores/results", { waitUntil: "domcontentloaded" })

    await acceptAtpCookies(page)

    const matches: MatchInterface[] = []
    const errors: string[] = []

    const dayButtons = await page.locator(".score-chip-item").all()

    for (const dayButton of [dayButtons[0]]) {
      if (!dayButton) {
        continue
      }

      const dateString = await dayButton.locator(".score-chip-item__subtitle").innerText()

      await dayButton.click()

      await page.waitForTimeout(2000)

      const matchCards = await page.locator(".scorecard-wrapper").all()

      for (const matchCard of matchCards) {
        const matchLink = matchCard.getByRole("link")

        const link = await matchLink.getAttribute("href")

        if (!link) continue

        const event = await matchCard.locator(".event").innerText()

        if (event in draws) {
          const draw = draws[event as keyof typeof draws]
          const court = await matchCard.locator(".court").innerText()
          const rawRound = await matchCard.locator(".round").innerText()
          const durationString = await matchCard.locator(".serve-speed").innerText()
          const matchNo = link.split("/").pop()

          const matchDetails = await scrapeMatch(browser, link)

          if (!matchDetails.success || !matchDetails.match) {
            errors.push(`Error scraping match: ${link}`)
            continue
          }

          const match: MatchInterface = {
            date: parseDate(`${dateString.toLowerCase()} ${year}`),
            court: court.replace(/^R:\s*/, ""),
            duration: parseDuration(durationString)!,
            round:
              draw.draw === "Qualifying" ? qualifyingRoundMapping[rawRound as keyof typeof qualifyingRoundMapping]
              : draw.match_type === "Doubles" ? doublesRoundMapping[rawRound as keyof typeof doublesRoundMapping]
              : singlesRoundMapping[rawRound as keyof typeof singlesRoundMapping],
            tour: draw.tour,
            draw: draw.draw,
            match_type: draw.match_type,
            format: draw.tour === "WTA" ? 3 : 5,
            match_link: `https://www.wimbledon.com${link}`,
            match_no: Number(matchNo),
            ...matchDetails.match
          }

          matches.push(match)
        } else {
          continue
        }
      }
    }

    return matches
  } finally {
    await page.close()
  }
}

const scrapeMatch = async (browser: Browser, link: string) => {
  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 1200
    }
  })

  try {
    await page.goto(`https://www.wimbledon.com${link}`, { waitUntil: "domcontentloaded" })

    await acceptAtpCookies(page)

    await page.waitForTimeout(2000)

    // Match info

    const match: Omit<
      MatchInterface,
      "date" | "court" | "round" | "tour" | "draw" | "match_type" | "format" | "match_link" | "match_no" | "duration"
    > = {
      t1_scores: [],
      t2_scores: [],
      t1: {
        entry_key: "",
        players: []
      },
      t2: {
        entry_key: "",
        players: []
      }
    }

    // Teams
    for (const teamNo of [1, 2]) {
      const teamContainer = page.locator(`.player-wrapper.team${teamNo}`)
      const playerLinks = await teamContainer.locator("a.player-name-link").all()

      for (const link of playerLinks) {
        const playerHref = await link.getAttribute("href")

        if (!playerHref) continue

        const playerId = playerHref.split("/").pop()?.replace("wta", "").replace("atp", "")

        if (!playerId) {
          console.error("Player ID not found", link)
          return {
            success: false,
            error: "Player ID not found"
          }
        }

        match[`t${teamNo}` as "t1" | "t2"].players.push(playerId === "itf800646827" ? "c0ro" : playerId)
      }

      match[`t${teamNo}` as "t1" | "t2"]["entry_key"] = match[`t${teamNo}` as "t1" | "t2"].players.join("-")
    }

    // scores
    const teamRows = await page.locator(".players-wrapper").locator(".team-scores").all()

    for (let i = 0; i < 2; i++) {
      const key = i === 0 ? "t1_scores" : "t2_scores"

      const teamRow = teamRows[i]

      if (!teamRow) {
        console.error("Team row not found", link)
        continue
      }

      const scoreWrappers = await teamRow.locator(".set-score").all()

      for (let j = 0; j < scoreWrappers.length; j++) {
        const score: Partial<ScoreInterface> = {
          set_no: j + 1
        }

        const scoreWrapper = scoreWrappers[j]

        if (!scoreWrapper) {
          console.error("Score wrapper not found", link)
          return {
            success: false,
            error: "Score wrapper not found"
          }
        }

        const setScore = await getParentText(scoreWrapper)

        const tiebreakWrapper = scoreWrapper.locator(".tiebreak")

        if ((await tiebreakWrapper.count()) > 0) {
          const tiebreakScore = await tiebreakWrapper.innerText()
          if (tiebreakScore) score.tb = Number(tiebreakScore)
        }

        const winnerCheckmark = scoreWrapper.locator("span.checkmark-icon")
        const status = scoreWrapper.locator(".statusTag")

        if ((await winnerCheckmark.count()) > 0) {
          match.winner = i + 1
        }

        if ((await status.count()) > 0) {
          const statusText = (await status.innerText()) as keyof typeof incompleteMapping
          match.incomplete = incompleteMapping[statusText as keyof typeof incompleteMapping]
        }

        if (setScore) {
          score.set = Number(setScore)
          match[key].push(score as ScoreInterface)
        }
      }
    }

    // Match stats
    await page.getByRole("tab", { name: "Stats" }).click()

    await page.waitForTimeout(5000)

    const readStats = async (statCategories: Record<string, string>) => {
      let results: any = {}

      const tableRows = await page.locator(".table-row").all()

      for (const row of tableRows) {
        const label = await row.locator(".row-labelcell-container").innerText()

        if (label in statCategories) {
          if (label === "Net points won (%)" || label === "Break points won (%)") {
            const t1 = await row.locator(".table-data-cell .align-left").locator(".data-subtitle").innerText()
            const t2 = await row.locator(".table-data-cell .align-right").locator(".data-subtitle").innerText()
            const [t1Nominator, t1Denominator] = t1.split("/")
            const [t2Nominator, t2Denominator] = t2.split("/")

            if (label === "Net points won (%)") {
              results = {
                ...results,
                net_w: {
                  t1: t1Nominator ? Number(t1Nominator) : null,
                  t2: t2Nominator ? Number(t2Nominator) : null
                },
                net: {
                  t1: t1Denominator ? Number(t1Denominator) : null,
                  t2: t2Denominator ? Number(t2Denominator) : null
                }
              }
            } else {
              results = {
                ...results,
                bps_converted: {
                  t1: t1Nominator ? Number(t1Nominator) : null,
                  t2: t2Nominator ? Number(t2Nominator) : null
                },
                bp_opps: {
                  t1: t1Denominator ? Number(t1Denominator) : null,
                  t2: t2Denominator ? Number(t2Denominator) : null
                },
                bps_saved: {
                  t1: t2Nominator && t2Denominator ? Number(t2Denominator) - Number(t2Nominator) : null,
                  t2: t1Nominator && t1Denominator ? Number(t1Denominator) - Number(t1Nominator) : null
                },
                bps_faced: {
                  t1: t2Denominator ? Number(t2Denominator) : null,
                  t2: t1Denominator ? Number(t1Denominator) : null
                }
              }
            }
          } else {
            const t1 = await row.locator(".table-data-cell .align-left").innerText()
            const t2 = await row.locator(".table-data-cell .align-right").innerText()

            results[statCategories[label] as string] = {
              t1: t1 ? Number(t1) : null,
              t2: t2 ? Number(t2) : null
            }

            if (label === "Service games") {
              results.return_games = {
                t1: t2 ? Number(t2) : null,
                t2: t1 ? Number(t1) : null
              }
            }
          }
        }
      }

      return results
    }

    const overallStats = await readStats({
      Aces: "aces",
      "Double faults": "dfs",
      Winners: "winners",
      "Unforced errors": "ues",
      "Net points won (%)": "net",
      "Break points won (%)": "bps"
    })

    const dropdown = page.locator("button#dropdown-chip")

    await dropdown.evaluate(el => el.scrollIntoView({ block: "center" }))
    await dropdown.click()
    await page.getByText("Serve stats").first().click()

    const serviceGames = await readStats({ "Service games": "serve_games" })

    let stats = {
      ...overallStats,
      ...serviceGames
    }

    const serveTabs = ["First Serve", "Second Serve"]

    for (const tab of serveTabs) {
      await page.getByRole("tab", { name: tab }).click()

      stats = {
        ...stats,
        ...(await readStats({
          "Total points": tab === "First Serve" ? "serve1" : "serve2",
          "Total points won": tab === "First Serve" ? "serve1_w" : "serve2_w",
          "Average serve speed (KMH)": tab === "First Serve" ? "avg1_speed" : "avg2_speed"
        }))
      }

      if (tab === "First Serve") {
        stats = {
          ...stats,
          ...(await readStats({ "Fastest serve speed (KMH)": "max_speed" }))
        }
      }
    }

    await dropdown.evaluate(el => el.scrollIntoView({ block: "center" }))
    await dropdown.click()
    await page.getByText("Return stats").first().click()

    for (const tab of serveTabs) {
      await page.getByRole("tab", { name: tab }).click()

      stats = {
        ...stats,
        ...(await readStats({
          "Return points": tab === "First Serve" ? "ret1" : "ret2",
          "Return points won": tab === "First Serve" ? "ret1_w" : "ret2_w"
        }))
      }
    }

    match.stats = stats

    return {
      success: true,
      match
    }
  } finally {
    await page.close()
  }
}
