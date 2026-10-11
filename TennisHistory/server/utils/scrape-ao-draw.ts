import type { SupabaseClient } from "@supabase/supabase-js"
import { Browser, chromium, Locator } from "playwright"
import type { Database } from "~/types/database.types"

type EntryInsert = Database["tennis"]["Tables"]["entries"]["Insert"]
type PEMInsert = Database["tennis"]["Tables"]["player_entry_mapping"]["Insert"]
type SeedInsert = Database["tennis"]["Tables"]["seeds"]["Insert"]
type EntryStatusInsert = Database["tennis"]["Tables"]["entry_status"]["Insert"]
type MatchScoreInsert = Database["tennis"]["Tables"]["match_scores"]["Insert"]
type MatchStatsInsert = Database["tennis"]["Tables"]["match_stats"]["Insert"]
type RetirementInsert = Database["tennis"]["Tables"]["retirements"]["Insert"]
type WalkoverInsert = Database["tennis"]["Tables"]["walkovers"]["Insert"]
type DefaultInsert = Database["tennis"]["Tables"]["defaults"]["Insert"]

const DATES = {
  "43219": "2026-01-12"
  //   "43220": "2026-01-13"
  //   "43221": "2026-01-14"
  //   "43222": "2026-01-15"
  //   "43225": "2026-01-18"
  //   "43226": "2026-01-19"
  //   "43227": "2026-01-20"
  //   "43228": "2026-01-21"
  //   "43229": "2026-01-22"
  //   "43230": "2026-01-23"
  //   "43231": "2026-01-24"
  //   "43232": "2026-01-25"
  //   "43233": "2026-01-26"
  //   "43234": "2026-01-27"
  //   "43235": "2026-01-28"
  //   "43236": "2026-01-29"
  //   "43237": "2026-01-30"
  //   "43238": "2026-01-31"
  //   "43239": "2026-02-01"
} as const

const PLAYERS = {
  "D. Aiava": "324219"
} as const

const EVENTS = {
  "Women's Doubles": {
    tour: "WTA",
    draw: "Main",
    match_type: "Doubles"
  },
  "Women's Singles": {
    tour: "WTA",
    draw: "Main",
    match_type: "Singles"
  },
  "Women's Qualifying Singles": {
    tour: "WTA",
    draw: "Qualifying",
    match_type: "Singles"
  }
} as const

const QUALIFYING_ROUNDS = {
  "Round 1": "Qualifying round 1",
  "Round 2": "Qualifying round 2",
  "Round 3": "Qualifying round 3"
} as const

const SINGLES_MAIN_ROUNDS = {
  "Round 1": "Round of 128",
  "Round 2": "Round of 64",
  "Round 3": "Round of 32",
  "Round 4": "Round of 16",
  Quarterfinals: "Quarterfinals",
  Semifinals: "Semifinals",
  Final: "Final"
} as const

const DOUBLES_MAIN_ROUNDS = {
  "Round 1": "Round of 64",
  "Round 2": "Round of 32",
  "Round 3": "Round of 16",
  Quarterfinals: "Quarterfinals",
  Semifinals: "Semifinals",
  Final: "Final"
}

const SINGLE_STATS = {
  Aces: "aces",
  "Double faults": "dfs",
  "Fastest serve (km/h)": "max_speed",
  "1st Serve Average (km/h)": "avg1_speed",
  "2nd serve average (km/h)": "avg2_speed",
  Winners: "winners",
  "Unforced errors": "ues"
}

const RATIO_STATS = {
  "Win 1st serve": ["serve1_w", "serve1", "ret1_w", "ret1"],
  "Win 2nd serve": ["serve2_w", "serve2", "ret2_w", "ret2"],
  "Break points won": ["bps_converted", "bp_opps", "bps_saved", "bps_faced"],
  "Net points won": ["net_w", "net"]
}

export async function scrapeAoDraw(supabase: SupabaseClient<Database>) {
  const browser = await chromium.launch({ headless: false })

  try {
    // Get events and rounds
    const { data: eventsData, error: eventsError } = await supabase
      .schema("tennis")
      .from("editions")
      .select(
        `
            id,
            tournament!inner(id, mens_id),
            events(
                id,
                tour,
                rounds(
                    id,
                    number,
                    round,
                    match_type,
                    draw
                )
            )
        `
      )
      .eq("year", new Date().getFullYear())
      .eq("tournament.mens_id", 580)
      .single()

    if (eventsError || !eventsData) {
      console.error("Error fetching events:", eventsError)
      return { success: false, error: "Error fetching events" }
    }

    const result = await scrapeResultsPage(browser)

    if (!result.matches) return result

    const matches = result.matches.map(match => {
      const event = eventsData.events.find(e => e.tour === match.tour)

      if (!event) return match

      const round = event.rounds.find(r => r.round === match.round && r.match_type === match.match_type && r.draw === match.draw)

      if (!round) return match

      return {
        ...match,
        event_id: event.id,
        round_id: round.id,
        match_no: Number(`${round.number}${match.match_no}`)
      }
    })

    const incompleteMatches = matches.filter(m => !m.event_id || !m.round_id)
    const eventMatches = matches.filter(m => m.event_id)
    const completeMatches = matches.filter(m => m.event_id && m.round_id)

    // Get unique entries
    const entriesToInsert: Record<string, EntryInsert> = {}

    eventMatches
      .filter(m => m.event_id)
      .forEach(match => {
        entriesToInsert[match.team_1.entryKey] = {
          event_id: match.event_id,
          match_type: match.match_type,
          entry_key: match.team_1.entryKey
        }
        entriesToInsert[match.team_2.entryKey] = {
          event_id: match.event_id,
          match_type: match.match_type,
          entry_key: match.team_2.entryKey
        }
      })

    // insert entries
    const { data: entries, error: entriesError } = await supabase
      .schema("tennis")
      .from("entries")
      .upsert(Object.values(entriesToInsert), { onConflict: "event_id,entry_key" })
      .select("id, event_id, match_type, entry_key")

    if (entriesError) {
      return {
        success: false,
        error: "Error inserting entries",
        entriesError
      }
    }

    const pemsToInsert: Record<string, PEMInsert> = {}
    const seedsToInsert: Record<string, SeedInsert> = {}
    const entryStatusesToInsert: Record<string, EntryStatusInsert> = {}

    eventMatches.forEach(match => {
      const team1 = match.team_1
      const team2 = match.team_2

      const team1Key = match.draw === "Main" ? team1.entryKey : `Q-${team1.entryKey}`
      const team2Key = match.draw === "Main" ? team2.entryKey : `Q-${team2.entryKey}`

      const team1Entry = entries.find(e => e.entry_key === team1.entryKey)!
      const team2Entry = entries.find(e => e.entry_key === team2.entryKey)!

      for (let i = 0; i < team1.players.length; i++) {
        const player1 = team1.players[i]
        const player2 = team2.players[i]
        pemsToInsert[`${team1Key}-${i}`] = {
          player_id: player1,
          entry_id: team1Entry.id,
          player_order: i + 1
        }
        pemsToInsert[`${team2Key}-${i}`] = {
          player_id: player2,
          entry_id: team2Entry.id,
          player_order: i + 1
        }
      }

      if (team1.seed) {
        seedsToInsert[team1Key] = {
          event_id: match.event_id,
          seed: team1.seed,
          draw: match.draw,
          match_type: match.match_type,
          entry_id: team1Entry.id
        }
      }

      if (team2.seed) {
        seedsToInsert[team2Key] = {
          event_id: match.event_id,
          seed: team2.seed,
          draw: match.draw,
          match_type: match.match_type,
          entry_id: team2Entry.id
        }
      }

      if (team1.status) {
        entryStatusesToInsert[team1Key] = {
          event_id: match.event_id,
          status: team1.status,
          draw: match.draw,
          entry_id: team1Entry.id
        }
      }

      if (team2.status) {
        entryStatusesToInsert[team2Key] = {
          event_id: match.event_id,
          status: team2.status,
          draw: match.draw,
          entry_id: team2Entry.id
        }
      }
    })

    // insert pem
    const { error: pemsError } = await supabase
      .schema("tennis")
      .from("player_entry_mapping")
      .upsert(Object.values(pemsToInsert), { onConflict: "entry_id,player_id" })

    if (pemsError) {
      return {
        success: false,
        error: "Error inserting pem",
        pemsError
      }
    }

    // insert seeds
    const { error: seedsError } = await supabase
      .schema("tennis")
      .from("seeds")
      .upsert(Object.values(seedsToInsert), { onConflict: "event_id,entry_id" })

    if (seedsError) {
      console.error("Error inserting seeds", seedsError)
    }

    // insert entry statuses
    const { error: entryStatusesError } = await supabase
      .schema("tennis")
      .from("entry_status")
      .upsert(Object.values(entryStatusesToInsert), { onConflict: "event_id,entry_id,status" })

    if (entryStatusesError) {
      console.error("Error inserting entry statuses", entryStatusesError)
    }

    // insert matches
    const matchesToInsert = completeMatches.map(match => {
      const team_1_id = entries.find(e => e.entry_key === match.team_1.entryKey)?.id
      const team_2_id = entries.find(e => e.entry_key === match.team_2.entryKey)?.id

      return {
        match_no: match.match_no,
        court: match.court,
        date: match.date,
        tour: match.tour,
        match_type: match.match_type,
        draw: match.draw,
        format: match.format,
        incomplete: match.incomplete,
        duration: match.duration,
        round_id: match.round_id,
        team_1_id,
        team_2_id,
        winner_id: match.winner === 1 ? team_1_id : team_2_id,
        loser_id: match.winner === 1 ? team_2_id : team_1_id,
        match_link: match.match_link
      }
    })
    const { data: matchesData, error: matchesError } = await supabase.schema("tennis").from("matches").insert(matchesToInsert).select("*")

    if (matchesError) {
      return {
        success: false,
        error: "Error inserting matches",
        matchesError
      }
    }

    const scoresToInsert: MatchScoreInsert[] = []
    const statsToInsert: MatchStatsInsert[] = []
    const walkoversToInsert: WalkoverInsert[] = []
    const retirementsToInsert: RetirementInsert[] = []
    const defaultsToInsert: DefaultInsert[] = []

    matchesData.forEach(match => {
      const m = completeMatches.find(m => m.match_link === match.match_link)

      if (m) {
        if (m.incomplete !== "WO") {
          scoresToInsert.push(
            ...m.team_1_scores.flatMap((score: any) => ({
              match_id: match.id,
              entry_id: match.team_1_id,
              set_no: score.set_no,
              set: score.set,
              tb: score.tb
            })),
            ...m.team_2_scores.flatMap((score: any) => ({
              match_id: match.id,
              entry_id: match.team_2_id,
              set_no: score.set_no,
              set: score.set,
              tb: score.tb
            }))
          )

          statsToInsert.push(
            {
              ...m.team_1_stats,
              match_id: match.id,
              entry_id: match.team_1_id
            },
            {
              ...m.team_2_stats,
              match_id: match.id,
              entry_id: match.team_2_id
            }
          )
        }

        if (match.loser_id) {
          if (m.incomplete === "WO") {
            walkoversToInsert.push({
              event_id: m.event_id,
              entry_id: match.loser_id,
              draw: match.draw
            })
          } else if (m.incomplete === "R") {
            retirementsToInsert.push({
              event_id: m.event_id,
              entry_id: match.loser_id,
              draw: match.draw
            })
          } else if (m.incomplete === "D") {
            defaultsToInsert.push({
              event_id: m.event_id,
              entry_id: match.loser_id,
              draw: match.draw
            })
          }
        }
      }
    })

    // insert match scores
    const { error: scoresError } = await supabase.schema("tennis").from("match_scores").insert(scoresToInsert)

    if (scoresError) {
      console.error("Error inserting match scores", scoresError)
    }

    // insert match stats
    const { error: statsError } = await supabase.schema("tennis").from("match_stats").insert(statsToInsert)

    if (statsError) {
      console.error("Error inserting match stats", statsError)
    }

    // insert walkovers
    if (walkoversToInsert.length > 0) {
      const { error: woError } = await supabase.schema("tennis").from("walkovers").insert(walkoversToInsert)

      if (woError) {
        console.error("Error inserting walkovers", woError)
      }
    }

    // insert retirements
    if (retirementsToInsert.length > 0) {
      const { error: retsError } = await supabase.schema("tennis").from("retirements").insert(retirementsToInsert)

      if (retsError) {
        console.error("Error inserting retirements", retsError)
      }
    }

    // insert defaults
    if (defaultsToInsert.length > 0) {
      const { error: defaultsError } = await supabase.schema("tennis").from("defaults").insert(defaultsToInsert)

      if (defaultsError) {
        console.error("Error inserting defaults", defaultsError)
      }
    }

    return {
      success: true,
      incompleteMatches,
      completeMatches
    }
  } finally {
    await browser.close()
  }
}

export async function scrapeAoMatch(supabase: SupabaseClient<Database>, matchLink: string, date: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const match = await scrapeMatch(browser, matchLink, date)

    return match
  } finally {
    await browser.close()
  }
}

const getGaugeText = async (gauge: Locator) => {
  const gaugeText = await gauge.locator("span.bar-gauge__inner-label").innerText()

  const [nominator, denominator] = gaugeText.split("/")

  return {
    nominator: Number(nominator),
    denominator: Number(denominator)
  }
}

const scrapeMatch = async (browser: Browser, matchLink: string, date: string) => {
  const match_no = matchLink.match(/\d+$/)?.[0] || ""

  const page = await browser.newPage()

  try {
    await page.goto(matchLink, { waitUntil: "domcontentloaded" })

    const matchCard = page.locator(".match-centre-scorecard")

    const eventText = (await matchCard.locator("p.score-header__title").innerText()).replace("2026 ", "")
    const matchSubtitle = await matchCard.locator("p.score-header__subtitle").innerText()
    const draw = EVENTS[eventText as keyof typeof EVENTS].draw
    const match_type = EVENTS[eventText as keyof typeof EVENTS].match_type
    const tour = EVENTS[eventText as keyof typeof EVENTS].tour
    const [roundText, court] = matchSubtitle.split(" • ")

    const durationText = await matchCard.locator("p.score-header__duration").innerText()
    const matchStatus = (await matchCard.locator("p.score-header__status").innerText()).trim()

    const match: Record<string, any> = {
      match_no,
      date,
      tour,
      draw,
      match_type,
      format: tour === "WTA" ? 3 : 5,
      match_link: matchLink,
      court,
      round:
        draw === "Qualifying" ? QUALIFYING_ROUNDS[roundText as keyof typeof QUALIFYING_ROUNDS]
        : match_type === "Singles" ? SINGLES_MAIN_ROUNDS[roundText as keyof typeof SINGLES_MAIN_ROUNDS]
        : DOUBLES_MAIN_ROUNDS[roundText as keyof typeof DOUBLES_MAIN_ROUNDS],
      incomplete:
        matchStatus === "Retired" ? "R"
        : matchStatus === "Walk-Over" ? "WO"
        : null,
      duration: parseDuration(durationText),
      team_1_stats: {},
      team_2_stats: {}
    }

    const teamRows = await matchCard.locator(".player-row").all()

    for (let i = 0; i < 2; i++) {
      const teamRow = teamRows[i]

      if (teamRow) {
        const team: { players: string[]; seed?: number; status?: string; entryKey?: string } = {
          players: []
        }

        const playerContainers = await teamRow.locator(".player-row__team").all()

        for (const playerContainer of playerContainers) {
          const playerName = await getParentText(playerContainer.locator("p"))
          const playerId = PLAYERS[playerName as keyof typeof PLAYERS]

          if (!playerId) {
            console.log("Player not found:", playerName, matchLink)
            return {
              success: false,
              match
            }
          }

          team.players.push(PLAYERS[playerName as keyof typeof PLAYERS])

          const playerStatus = await playerContainer.locator("p span").innerText()

          if (playerStatus) {
            if (isNaN(parseInt(playerStatus))) {
              team.status = playerStatus === "A" ? "AL" : playerStatus
            } else {
              team.seed = parseInt(playerStatus)
            }
          }
        }

        team.entryKey = team.players.join("-")

        match[`team_${i + 1}`] = team

        const winnerBadge = teamRow.locator(".player-row__score-badge").locator("svg")

        if ((await winnerBadge.count()) > 0) {
          match.winner = i + 1
        }

        if (match.incomplete !== "WO") {
          const scores: Array<{ set_no: number; set: number; tb?: number }> = []
          const scoresWrappers = await teamRow.locator("p.player-row__score-game").all()

          for (let j = 0; j < scoresWrappers.length; j++) {
            const scoreWrapper = scoresWrappers[j]

            if (scoreWrapper) {
              const score = await getParentText(scoreWrapper)
              const tb = await scoreWrapper.locator("span").innerText()

              scores.push({
                set_no: j + 1,
                set: parseInt(score),
                tb: tb ? parseInt(tb) : undefined
              })
            } else {
              console.log("Team scores not found for ", matchLink)
              return { success: false, match }
            }

            match[`team_${i + 1}_scores`] = scores
          }
        }
      } else {
        console.log("Team row not found for ", matchLink)
        return { success: false, match }
      }
    }

    if (match.incomplete !== "WO") {
      await page.getByRole("link", { name: "Stats" }).click()

      const statRows = await page.locator(".stats-comparison-row").all()

      for (const statRow of statRows) {
        const title = await statRow.locator(".stats-comparison-row-label--row-title").innerText()

        if (title in SINGLE_STATS) {
          const key = SINGLE_STATS[title as keyof typeof SINGLE_STATS]
          const team1Stat = await statRow.locator(".stats-comparison-row-label--left").innerText()
          const team2Stat = await statRow.locator(".stats-comparison-row-label--right").innerText()

          match[`team_1_stats`][key] = parseInt(team1Stat)
          match[`team_2_stats`][key] = parseInt(team2Stat)
        } else if (title in RATIO_STATS) {
          const keys = RATIO_STATS[title as keyof typeof RATIO_STATS]
          const gauges = await statRow.locator(".bar-gauge").all()

          const team1Gauge = gauges[0]
          const team2Gauge = gauges[1]

          if (team1Gauge && team2Gauge) {
            const team1Stat = await getGaugeText(team1Gauge)
            const team2Stat = await getGaugeText(team2Gauge)

            if (keys[0] && keys[1]) {
              match[`team_1_stats`][keys[0]] = team1Stat.nominator
              match[`team_1_stats`][keys[1]] = team1Stat.denominator
              match[`team_2_stats`][keys[0]] = team2Stat.nominator
              match[`team_2_stats`][keys[1]] = team2Stat.denominator
            }

            if (keys[2] && keys[3]) {
              match[`team_1_stats`][keys[2]] = team2Stat.denominator - team2Stat.nominator
              match[`team_1_stats`][keys[3]] = team2Stat.denominator
              match[`team_2_stats`][keys[2]] = team1Stat.denominator - team1Stat.nominator
              match[`team_2_stats`][keys[3]] = team1Stat.denominator
            }
          }
        }
      }
    }

    return {
      success: true,
      match
    }
  } finally {
    await page.close()
  }
}

const scrapeResultsCard = async (browser: Browser, matchCard: Locator, date: string) => {
  const matchLink = await matchCard.getByRole("link", { name: "Match Center Link" }).getAttribute("href")

  if (matchLink) {
    return await scrapeMatch(browser, matchLink, date)
  } else {
    return { success: false }
  }
}

const scrapeResultsPage = async (browser: Browser) => {
  const page = await browser.newPage()

  try {
    const matches = []

    for (const daySuffix of Object.keys(DATES)) {
      await page.goto(`https://ausopen.com/results#!257400,257397,257399?dayId=${daySuffix}`, { waitUntil: "domcontentloaded" })

      await page.waitForTimeout(2000)

      const date = DATES[daySuffix as keyof typeof DATES]

      const matchCards = await page.locator(".score-row").all()

      for (let i = 0; i < matchCards.length; i++) {
        const matchCard = matchCards[i]

        if (matchCard) {
          const result = await scrapeResultsCard(browser, matchCard, date)

          if (result.success && "match" in result) {
            matches.push(result.match)
          } else {
            console.error("Error scraping match:", date, i)
          }
        }
      }

      await page.waitForTimeout(2000)
    }

    return {
      success: true,
      matches
    }
  } finally {
    await page.close()
  }
}
