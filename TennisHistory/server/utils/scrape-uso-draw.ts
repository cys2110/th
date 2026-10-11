import type { SupabaseClient } from "@supabase/supabase-js"
import { Browser, chromium, Locator, Page } from "playwright"
import type { Database } from "~/types/database.types"

interface EventOption {
  value: string
  label: string
  tour: TourEnum
  draw: DrawEnum
  match_type: MatchTypeEnum
}

interface Team {
  entry_key: string
  players: string[]
}

type Set = Omit<ScoreInsert, "entry_id" | "match_id">

type Match = Pick<MatchInsert, "match_no" | "court" | "date" | "tour" | "match_type" | "draw" | "format" | "duration" | "incomplete"> & {
  t1: Team
  t2: Team
  t1_scores: Set[]
  t2_scores: Set[]
  round: string
  winner: 1 | 2
  stats: Record<string, { t1: number | undefined | null; t2: number | undefined | null }> | null
}

const EVENT_OPTIONS: Array<EventOption> = [
  //   { value: "A", label: "Women's Singles", tour: "WTA", draw: "Main", match_type: "Singles" }
  //   { value: "B", label: "Men's Singles", tour: "ATP", draw: "Main", match_type: "Singles" }
  // { value: "C", label: "Women's Doubles", tour: "WTA", draw: "Main", match_type: "Doubles" }
  // { value: "D", label: "Men's Doubles", tour: "ATP", draw: "Main", match_type: "Doubles" }
  // { value: "T", label: "Women's Qual", tour: "WTA", draw: "Qualifying", match_type: "Singles" }
  { value: "U", label: "Men's Qual", tour: "ATP", draw: "Qualifying", match_type: "Singles" }
]

const DATES = [
  { label: "FW1", date: "2026-08-24" },
  { label: "FW2", date: "2026-08-25" },
  { label: "FW3", date: "2026-08-26" },
  { label: "FW4", date: "2026-08-27" },
  { label: "FW5", date: "2026-08-28" },
  { label: "FW6", date: "2026-08-29" },
  { label: "1", date: "2026-08-30" },
  { label: "2", date: "2026-08-31" },
  { label: "3", date: "2026-09-01" },
  { label: "4", date: "2026-09-02" },
  { label: "5", date: "2026-09-03" },
  { label: "6", date: "2026-09-04" },
  { label: "7", date: "2026-09-05" },
  { label: "8", date: "2026-09-06" },
  { label: "9", date: "2026-09-07" },
  { label: "10", date: "2026-09-08" },
  { label: "11", date: "2026-09-09" },
  { label: "12", date: "2026-09-10" },
  { label: "13", date: "2026-09-11" },
  { label: "14", date: "2026-09-12" },
  { label: "15", date: "2026-09-13" }
]

const COURTS = {
  AA: "Arthur Ashe Stadium",
  AB: "Louis Armstrong Stadium",
  AC: "Grandstand",
  AD: "Stadium 17",
  AE: "Court 5",
  AG: "Court 6",
  AH: "Court 7",
  AI: "Court 8",
  AJ: "Court 9",
  AK: "Court 10",
  AL: "Court 11",
  AM: "Court 12",
  AN: "Court 13",
  AO: "Court 14",
  AP: "Court 15",
  AQ: "Court 16"
}

const QUALIFYING_ROUNDS = {
  R1: "Qualifying round 1",
  R2: "Qualifying round 2",
  R3: "Qualifying round 3"
}

const DOUBLES_ROUNDS = {
  F: "Final",
  SF: "Semifinals",
  QF: "Quarterfinals",
  R3: "Round of 16",
  R2: "Round of 32",
  R1: "Round of 64"
}

const SINGLES_ROUNDS = {
  F: "Final",
  SF: "Semifinals",
  QF: "Quarterfinals",
  R4: "Round of 16",
  R3: "Round of 32",
  R2: "Round of 64",
  R1: "Round of 128"
}

export async function scrapeUsoDraw(supabase: SupabaseClient<Database>, year: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const { data: edition, error: editionError } = await supabase
      .schema("tennis")
      .from("editions")
      .select("tournament!inner(id), events(id, tour, rounds(*))")
      .eq("tournament.mens_id", 560)
      .eq("year", Number(year))
      .single()

    if (editionError || !edition) {
      console.error("Error fetching edition:", editionError)
      return {
        success: false,
        error: "Error fetching edition"
      }
    }

    // const checkPlayersResult = await checkPlayers(browser)

    // const verifyPlayersResult = await verifyExistingPlayers(supabase, checkPlayersResult)

    // if (!verifyPlayersResult.success) {
    //   return {
    //     success: false,
    //     error: "Error checking existing players"
    //   }
    // } else if (verifyPlayersResult.count) {
    //   return {
    //     success: false,
    //     error: "Missing players",
    //     missingPlayers: verifyPlayersResult.playersNotInSupabase
    //   }
    // }

    const matches = await scrapeResults(browser)

    // Entries
    const entriesToInsert: Record<string, EntryInsert & { players: string[] }> = {}

    matches.forEach(match => {
      const event = edition.events.find(e => e.tour === match.tour)

      if (!event) {
        console.error("No event found for tour", match)
        return
      }
      const team1 = match.t1
      const team2 = match.t2

      entriesToInsert[team1.entry_key] = {
        entry_key: team1.entry_key,
        event_id: event.id,
        players: team1.players,
        match_type: match.match_type
      }

      entriesToInsert[team2.entry_key] = {
        entry_key: team2.entry_key,
        event_id: event.id,
        players: team2.players,
        match_type: match.match_type
      }
    })

    const { data: entries, error: entriesError } = await supabase
      .schema("tennis")
      .from("entries")
      .upsert(
        Object.values(entriesToInsert).map(entry => {
          const { players, ...rest } = entry
          return rest
        }),
        { onConflict: "entry_key,event_id" }
      )
      .select("id, entry_key")

    if (entriesError || !entries) {
      console.error("Error creating entries:", entriesError)
      return {
        success: false,
        error: "Error creating entries"
      }
    } else {
      entries.forEach(entry => {
        if (entry.entry_key) {
          entriesToInsert[entry.entry_key]!.id = entry.id
        }
      })
    }

    // PEM
    const { error: pemError } = await supabase
      .schema("tennis")
      .from("player_entry_mapping")
      .upsert(
        Object.values(entriesToInsert).flatMap(entry =>
          entry.players.map((player, index) => ({
            player_id: player,
            entry_id: entry.id!,
            player_order: index + 1
          }))
        ),
        { onConflict: "player_id,entry_id" }
      )

    if (pemError) {
      console.error("Error creating player entry mapping:", pemError)
      return {
        success: false,
        error: "Error creating player entry mapping"
      }
    }

    const matchesToInsert: MatchInsert[] = []

    matches.forEach(match => {
      const { t1, t2, t1_scores, t2_scores, round, winner, stats, ...rest } = match

      const eventRound = edition.events
        .find(e => e.tour === match.tour)
        ?.rounds.find(r => r.round === round && r.match_type === match.match_type && r.draw === match.draw)

      if (!eventRound) {
        console.error("No event round found for match", match)
        return
      }

      const team_1_id = entriesToInsert[t1.entry_key]?.id
      const team_2_id = entriesToInsert[t2.entry_key]?.id

      matchesToInsert.push({
        ...rest,
        round_id: eventRound.id,
        team_1_id,
        team_2_id,
        winner_id: winner === 1 ? team_1_id : team_2_id,
        loser_id: winner === 2 ? team_1_id : team_2_id
      })
    })

    // Matches
    const { data: insertedMatches, error: matchesError } = await supabase.schema("tennis").from("matches").insert(matchesToInsert).select("*")

    if (matchesError || !insertedMatches) {
      console.error("Error creating matches:", matchesError)
      return {
        success: false,
        error: "Error creating matches"
      }
    }

    // Walkovers
    const { error: walkoversError } = await supabase
      .schema("tennis")
      .from("walkovers")
      .insert(
        insertedMatches
          .filter(match => match.incomplete === "WO")
          .map(match => {
            const event = edition.events.find(e => e.tour === match.tour)

            return {
              event_id: event!.id,
              entry_id: match.loser_id!,
              draw: match.draw
            }
          })
      )

    if (walkoversError) {
      console.error("Error creating walkovers:", walkoversError)
    }

    // Retirements
    const { error: retirementsError } = await supabase
      .schema("tennis")
      .from("retirements")
      .insert(
        insertedMatches
          .filter(match => match.incomplete === "R")
          .map(match => {
            const event = edition.events.find(e => e.tour === match.tour)

            return {
              event_id: event!.id,
              entry_id: match.loser_id!,
              draw: match.draw
            }
          })
      )

    if (retirementsError) {
      console.error("Error creating retirements:", retirementsError)
    }

    const scoresToInsert: ScoreInsert[] = []
    const statsToInsert: StatsInsert[] = []

    matches.forEach(match => {
      if (match.stats) {
        const matching = insertedMatches.find(m => m.match_no === match.match_no)

        if (!matching) {
          console.error("No match found for match", match)
          return
        }

        scoresToInsert.push(
          ...match.t1_scores.map(score => ({
            match_id: matching.id,
            entry_id: matching.team_1_id!,
            set_no: score.set_no,
            set: score.set,
            tb: score.tb
          })),
          ...match.t2_scores.map(score => ({
            match_id: matching.id,
            entry_id: matching.team_2_id!,
            set_no: score.set_no,
            set: score.set,
            tb: score.tb
          }))
        )

        const statsKeys = Object.keys(match.stats)

        statsToInsert.push(
          {
            match_id: matching.id,
            entry_id: matching.team_1_id!,
            ...Object.fromEntries(statsKeys.map(key => [key, match.stats![key]!.t1]))
          },
          {
            match_id: matching.id,
            entry_id: matching.team_2_id!,
            ...Object.fromEntries(statsKeys.map(key => [key, match.stats![key]!.t2]))
          }
        )
      }
    })

    // Match Scores
    const { error: scoresError } = await supabase.schema("tennis").from("match_scores").insert(scoresToInsert)

    // Match Stats
    const { error: statsError } = await supabase.schema("tennis").from("match_stats").insert(statsToInsert)

    if (scoresError || statsError) {
      console.error("Error creating scores or stats:", scoresError, statsError)
      return {
        success: false,
        error: "Error creating scores or stats"
      }
    }

    return {
      success: true,
      insertedMatches
    }
  } finally {
    await browser.close()
  }
}

const selectPlayers = async (container: Locator) => {
  const players: Record<string, string> = {}

  const playerContainers = await container.locator("li").all()

  for (const container of playerContainers) {
    const dataId = await container.locator("span").first().getAttribute("data-id")
    const playerName = await container.locator("span.playerName").innerText()

    if (dataId && playerName) {
      players[dataId.replace("atp", "").replace("wta", "")] = playerName
    } else {
      console.error("No data-id or player name found", dataId, playerName)
    }
  }

  return players
}

const checkPlayers = async (browser: Browser) => {
  const page = await browser.newPage()

  let allPlayers: Record<string, string> = {}

  try {
    await page.goto("https://www.usopen.org/en_US/players/index.html", { waitUntil: "domcontentloaded" })

    for (const option of EVENT_OPTIONS) {
      const eventSelector = page.locator("select.blue-bar-dropdown-selected")

      await eventSelector.selectOption(option.value)

      await page.waitForTimeout(1000)

      const playerContainer = page.locator(".playerContainer")

      const players = await selectPlayers(playerContainer)

      allPlayers = { ...allPlayers, ...players }
    }

    return allPlayers
  } finally {
    await page.close()
  }
}

const getTeamScore = async (teamContainer: Locator) => {
  const scores: Array<Set> = []

  const scoreContainers = await teamContainer.locator(".scores").all()

  for (let i = 0; i < scoreContainers.length; i++) {
    const scoreContainer = scoreContainers[i]

    if (scoreContainer) {
      const score = await getParentText(scoreContainer)

      const set: Set = {
        set_no: i + 1,
        set: Number(score)
      }

      const tiebreak = await scoreContainer.locator(".tiebreak").innerText()

      if (tiebreak) {
        set.tb = Number(tiebreak)
      }

      scores.push(set)
    }
  }

  return scores
}

const STATS_CATEGORIES = {
  aces: "aces",
  double_faults: "dfs",
  win_pct_first_srv: ["serve1_w", "serve1", "ret1_w", "ret1"],
  win_pct_second_srv: ["serve2_w", "serve2", "ret2_w", "ret2"],
  net_points_won: ["net_w", "net"],
  break_points_won: ["bps_converted", "bp_opps", "bps_saved", "bps_faced"],
  winners: "winners",
  unforced_errors: "ues"
}

export function parseFraction(value: string) {
  const [fraction] = value.split(" ")
  const [numerator, denominator] = fraction!.split("/").map(Number)

  return {
    numerator,
    denominator
  }
}

const getStats = async (page: Page, container: Locator) => {
  const stats: Record<string, { t1: number | null | undefined; t2: number | null | undefined }> = {}

  const statsSummary = container.locator("div.stats-content")

  const statsRows = await statsSummary.locator("div.stats-row").all()

  for (const row of statsRows) {
    const dataRef = await row.getAttribute("data-ref")

    if (dataRef && dataRef in STATS_CATEGORIES) {
      const keys = STATS_CATEGORIES[dataRef as keyof typeof STATS_CATEGORIES]

      const t1Value = await row.locator(".t1").innerText()
      const t2Value = await row.locator(".t2").innerText()

      if (Array.isArray(keys)) {
        const { numerator: t1Nominator, denominator: t1Denominator } = parseFraction(t1Value)
        const { numerator: t2Nominator, denominator: t2Denominator } = parseFraction(t2Value)

        stats[keys[0]!] = {
          t1: t1Nominator,
          t2: t2Nominator
        }
        stats[keys[1]!] = {
          t1: t1Denominator,
          t2: t2Denominator
        }

        if (keys[2] && keys[3] && t1Denominator && t2Denominator && t1Nominator && t2Nominator) {
          stats[keys[2]!] = {
            t1: t2Denominator - t2Nominator,
            t2: t1Denominator - t1Nominator
          }
          stats[keys[3]!] = {
            t1: t2Denominator,
            t2: t1Denominator
          }
        }
      } else {
        stats[keys] = {
          t1: Number(t1Value),
          t2: Number(t2Value)
        }
      }
    }
  }

  await container.getByRole("button", { name: "Overall Stats" }).click()

  await page.waitForTimeout(500)

  await container.locator("div.select-menu-dropdown").getByRole("button", { name: "Serve Stats", exact: true }).click()

  await page.waitForTimeout(500)

  const statsTable = page.locator("div.stats-table")

  const getSpeed = async (cell: Locator): Promise<number | null> => {
    const metric = cell.locator("span.metric")

    if ((await metric.count()) === 0) return null

    return Number((await metric.innerText()).replace(" KMH", "").trim())
  }

  // Average serve speed is last div with "stats-row border" class
  const avgServeSpeed = statsTable.locator("div.stats-row.border").last()

  // Max speed is last div with "stats-row" class
  const maxServeSpeed = statsTable.locator("div.stats-row").last()

  stats.avg1_speed = {
    t1: await getSpeed(avgServeSpeed.locator(".t1.first")),
    t2: await getSpeed(avgServeSpeed.locator(".t2.first"))
  }
  stats.avg2_speed = {
    t1: await getSpeed(avgServeSpeed.locator(".t1.second")),
    t2: await getSpeed(avgServeSpeed.locator(".t2.second"))
  }
  stats.max_speed = {
    t1: await getSpeed(maxServeSpeed.locator(".t1.total")),
    t2: await getSpeed(maxServeSpeed.locator(".t2.total"))
  }

  return stats
}

const scrapeResults = async (browser: Browser) => {
  const page = await browser.newPage()

  const matches: Array<Match> = []

  try {
    await page.goto("https://www.usopen.org/en_US/scores/completed_matches/index.html?promo=subnav", { waitUntil: "domcontentloaded" })

    for (const option of EVENT_OPTIONS) {
      const eventSelector = page.locator("select.blue-bar-dropdown-selected")

      await eventSelector.selectOption(option.value)

      await page.waitForTimeout(1000)

      for (const date of DATES) {
        await page.getByRole("button", { name: date.label, exact: true }).click()

        await page.waitForTimeout(1000)

        const matchContent = page.locator(".match-content")

        const matchCards = await matchContent.locator(".one-col").all()

        for (const matchCard of matchCards) {
          const cardClass = await matchCard.getAttribute("class")

          if (!cardClass) {
            continue
          }

          const players = cardClass
            .split(" ")
            .slice(1)
            .map(player => player.replace("atp", "").replace("wta", ""))

          const team1 = players.slice(0, players.length === 4 ? 2 : 1)
          const team2 = players.slice(players.length === 4 ? 2 : 1)

          const matchBox = matchCard.locator(".match-box")
          const dataMatch = await matchBox.getAttribute("data-match")
          const dataCourt = await matchBox.getAttribute("data-court")
          const eventRound = await matchBox.locator("span.event-round").innerText()

          const incomplete = await matchBox.locator(".results-info-status").innerText()

          const noScore = incomplete === "Walkover"

          const durationContainer = noScore ? null : await matchBox.locator("span.duration").innerText()

          const team1Container = matchBox.locator(".team-one")
          const team2Container = matchBox.locator(".team-two")

          const team1Class = await team1Container.getAttribute("class")

          let stats = null

          if (!noScore) {
            const slamtrackerButton = matchCard.locator(".slamtracker-button")

            await slamtrackerButton.scrollIntoViewIfNeeded()
            await slamtrackerButton.click()

            await page.waitForTimeout(1000)

            const statsPanel = page.locator(".stpanel-container")

            stats = noScore ? {} : await getStats(page, statsPanel)

            await statsPanel.locator("div.stpanel-content-close").locator("i.icon-close").click()

            await page.waitForTimeout(2000)
          }

          const match: Match = {
            match_no: dataMatch ? Number(dataMatch) : 0,
            court: dataCourt ? COURTS[dataCourt as keyof typeof COURTS] : null,
            date: date.date,
            tour: option.tour,
            match_type: option.match_type,
            draw: option.draw,
            format: option.tour === "ATP" && option.draw === "Main" ? 5 : 3,
            duration: durationContainer ? `${durationContainer.replace("Duration: ", "").trim()}:00` : "00:00:00",
            round:
              option.draw === "Qualifying" ? QUALIFYING_ROUNDS[eventRound as keyof typeof QUALIFYING_ROUNDS]
              : option.match_type === "Doubles" ? DOUBLES_ROUNDS[eventRound as keyof typeof DOUBLES_ROUNDS]
              : SINGLES_ROUNDS[eventRound as keyof typeof SINGLES_ROUNDS],
            t1: {
              entry_key: team1.join("-"),
              players: team1
            },
            t2: {
              entry_key: team2.join("-"),
              players: team2
            },
            winner: team1Class && team1Class.includes("winner") ? 1 : 2,
            t1_scores: noScore ? [] : await getTeamScore(team1Container),
            t2_scores: noScore ? [] : await getTeamScore(team2Container),
            incomplete:
              noScore ? "WO"
              : incomplete === "Retired" ? "R"
              : null,
            stats
          }

          matches.push(match)
        }
      }
    }

    return matches
  } finally {
    await page.close()
  }
}
