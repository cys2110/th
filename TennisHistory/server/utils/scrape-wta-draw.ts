import type { SupabaseClient } from "@supabase/supabase-js"
import { Browser, chromium, Page } from "playwright"
import { Database } from "~/types/database.types"

interface Score {
  set_no: number
  set: number
  tb?: number
  entry: string
}

interface Match {
  tour: TourEnum
  format: 3 | 5
  draw: DrawEnum
  match_type: MatchTypeEnum
  round: string
  match_no: number
  match_link: string | null
  winner: number
  t1: string
  t2: string
  incomplete: IncompleteEnum
  t1_scores: Score[]
  t2_scores: Score[]
}

const STATUSES: Record<string, StatusEnum> = {
  "wild card": "WC",
  alternate: "AL",
  qualifier: "Q",
  "lucky loser": "LL"
}

const EVENTS: Record<string, { draw: DrawEnum; match_type: MatchTypeEnum }> = {
  LS: {
    draw: "Main",
    match_type: "Singles"
  },
  LD: {
    draw: "Main",
    match_type: "Doubles"
  },
  RS: {
    draw: "Qualifying",
    match_type: "Singles"
  }
}

const MAIN_ROUNDS = {
  "128": "Round of 128",
  "64": "Round of 64",
  "32": "Round of 32",
  "16": "Round of 16",
  "8": "Quarterfinals",
  "4": "Semifinals",
  "2": "Final"
}

export async function scrapeWtaDraw(supabase: SupabaseClient<Database>, tournamentId: string, dbId: string, year: string, editionNo: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const { data: editionData, error: editionError } = await supabase
      .schema("tennis")
      .from("editions")
      .select(
        `
        id,
        tournament!inner(womens_id),
        events(id, tour, rounds(*))
        `
      )
      .eq("tournament.womens_id", Number(dbId))
      .eq("edition_no", Number(editionNo))
      .eq("year", Number(year))
      .single()

    const event = editionData?.events.find(e => e.tour === "WTA")

    if (editionError || !editionData || !event) {
      console.error("Error fetching edition", editionError)
      return {
        success: false,
        error: editionError || "Error fetching edition"
      }
    }

    // Check if all players exist
    const entriesResult = await fetchEntries({ browser, tournamentId, year })

    const verifyPlayersResult = await verifyExistingPlayers(supabase, entriesResult.players)

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

    const matches = await scrapeDraw(browser, tournamentId, year)

    // Add entries
    const { data: entriesData, error: entriesError } = await supabase
      .schema("tennis")
      .from("entries")
      .upsert(
        Object.entries(entriesResult.entries).map(([entryKey, entryValue]) => ({
          match_type: entryValue.match_type,
          event_id: event.id,
          entry_key: entryKey
        })),
        { onConflict: "event_id,entry_key" }
      )
      .select("id, entry_key")

    if (entriesError) {
      console.error("Error inserting entries", entriesError)
      return {
        success: false,
        error: entriesError || "Error inserting entries"
      }
    }

    const entries = Object.fromEntries(entriesData.map(entry => [entry.entry_key!, entry.id]))

    const playersToInsert: PemInsert[] = []
    const seedsToInsert: SeedInsert[] = []
    const statusesToInsert: EntryStatusInsert[] = []

    entriesData.forEach(entry => {
      const matchingEntry = entriesResult.entries[entry.entry_key!]

      if (!matchingEntry) {
        return
      }

      matchingEntry.players.forEach((player, index) =>
        playersToInsert.push({
          player_id: player,
          entry_id: entry.id,
          player_order: index + 1
        })
      )

      if (matchingEntry.seed || matchingEntry.q_seed) {
        seedsToInsert.push({
          event_id: event.id,
          entry_id: entry.id,
          seed: matchingEntry.seed || matchingEntry.q_seed!,
          draw: matchingEntry.seed ? "Main" : "Qualifying",
          match_type: matchingEntry.match_type
        })
      }

      if (matchingEntry.status) {
        statusesToInsert.push({
          event_id: event.id,
          entry_id: entry.id,
          status: matchingEntry.status,
          draw: "Main"
        })
      }

      if (matchingEntry.q_status) {
        statusesToInsert.push({
          event_id: event.id,
          entry_id: entry.id,
          status: matchingEntry.q_status,
          draw: "Qualifying"
        })
      }
    })

    // Add pem
    const { error: pemError } = await supabase
      .schema("tennis")
      .from("player_entry_mapping")
      .upsert(playersToInsert, { onConflict: "entry_id,player_id" })

    if (pemError) {
      console.error("Error inserting player_entry_mapping", pemError)
      return {
        success: false,
        error: pemError || "Error inserting player_entry_mapping"
      }
    }

    // Add seeds
    const { error: seedsError } = await supabase.schema("tennis").from("seeds").upsert(seedsToInsert, { onConflict: "event_id,entry_id" })

    if (seedsError) {
      console.error("Error adding seeds", seedsError)
    }

    // Add entry statuses
    const { error: statusError } = await supabase
      .schema("tennis")
      .from("entry_status")
      .upsert(statusesToInsert, { onConflict: "event_id,entry_id,status" })

    if (statusError) {
      console.error("Error adding statuses", statusError)
    }

    // Add matches
    const { data: matchesData, error: matchesError } = await supabase
      .schema("tennis")
      .from("matches")
      .insert(
        matches.map(match => {
          const { round, winner, t1, t2, t1_scores, t2_scores, ...rest } = match

          return {
            ...rest,
            round_id: event.rounds.find(r => r.draw === rest.draw && r.match_type === rest.match_type && r.round === round)!?.id,
            team_1_id: entries[t1],
            team_2_id: entries[t2],
            winner_id: winner === 1 ? entries[t1] : entries[t2],
            loser_id: winner === 2 ? entries[t1] : entries[t2]
          }
        })
      )
      .select("id, match_link")

    if (matchesError || !matchesData) {
      console.error("Error inserting matches", matchesError)
      return {
        success: false,
        error: matchesError || "Error inserting matches"
      }
    }

    // Add scores
    const scoresToInsert: ScoreInsert[] = []

    matchesData.forEach(match => {
      const matchingMatch = matches.find(m => m.match_link === match.match_link)

      if (!matchingMatch || matchingMatch.incomplete === "WO" || matchingMatch.incomplete === "B") {
        return
      }

      const { t1_scores, t2_scores } = matchingMatch

      scoresToInsert.push(
        ...t1_scores.map(score => ({
          match_id: match.id,
          entry_id: entries[score.entry]!,
          set_no: score.set_no,
          set: score.set,
          tb: score.tb
        })),
        ...t2_scores.map(score => ({
          match_id: match.id,
          entry_id: entries[score.entry]!,
          set_no: score.set_no,
          set: score.set,
          tb: score.tb
        }))
      )
    })

    const { error: scoresError } = await supabase.schema("tennis").from("match_scores").insert(scoresToInsert)

    if (scoresError) {
      console.error("Error inserting scores", scoresError)
      return {
        success: false,
        error: scoresError || "Error inserting scores"
      }
    }

    return {
      success: true,
      entries: entriesResult.entries,
      matches
    }
  } finally {
    await browser.close()
  }
}

interface FetchEntries {
  browser: Browser
  tournamentId: string
  year: string
}

interface Entry {
  players: string[]
  seed?: number
  status?: StatusEnum
  q_seed?: number
  q_status?: StatusEnum
  match_type: MatchTypeEnum
}

const fetchEntries = async ({ browser, tournamentId, year }: FetchEntries) => {
  const page = await browser.newPage()

  const players: Record<string, string> = {}
  const entries: Record<string, Entry> = {}

  try {
    await page.goto(`https://www.wtatennis.com/tournaments/${tournamentId}/x/${year}/player-list`)

    await acceptWtaCookies(page)

    const eventTabs = await page.locator("div.tournament-player-list__tab").all()

    for (const eventTab of eventTabs) {
      const event = (await eventTab.getAttribute("data-ui-tab"))!.trim().toLowerCase()

      const draw = event === "qualifying" ? "Qualifying" : "Main"
      const matchType = event === "doubles" ? "Doubles" : "Singles"

      const playerCards = await eventTab.locator(".tournament-player-card__card").all()

      for (const playerCard of playerCards) {
        const playerLinks = await playerCard.locator("a.tournament-player-card__name").all()
        const teamPlayers: string[] = []

        for (const link of playerLinks) {
          const playerId = await link.getAttribute("data-tracking-player-id")
          const playerName = await link.getAttribute("data-tracking-player-name")

          if (playerId && playerName) {
            players[playerId] = playerName
            teamPlayers.push(playerId)
          }
        }

        const entryKey = teamPlayers.join("-")

        entries[entryKey] = {
          ...entries[entryKey],
          players: teamPlayers,
          match_type: matchType
        }

        const seedContainer = playerCard.locator("span.tournament-player-card__rank-number")

        if ((await seedContainer.count()) > 0) {
          const seed = Number((await seedContainer.innerText()).trim().replace("#", ""))

          entries[entryKey][draw === "Main" ? "seed" : "q_seed"] = seed
        }

        const statusContainer = playerCard.locator("div.theme-chalk.badge")

        if ((await statusContainer.count()) > 0) {
          const statusText = await statusContainer.innerText()
          const status = STATUSES[statusText.trim().toLowerCase() as keyof typeof STATUSES]

          entries[entryKey][draw === "Main" ? "status" : "q_status"] = status
        }
      }
    }

    return {
      players,
      entries
    }
  } finally {
    await page.close()
  }
}

const scrapeDraw = async (browser: Browser, tournamentId: string, year: string) => {
  const page = await browser.newPage()

  const matches: Match[] = []

  try {
    await page.goto(`https://www.wtatennis.com/tournaments/${tournamentId}/x/${year}/draws`)

    const script = await page.locator('script[type="application/ld+json"]').nth(3).textContent()

    const json = JSON.parse(script!)

    const eventLink: string = json["@id"]

    const drawsContainer = await page.locator("div.tournament-draw__tab").all()

    for (const drawContainer of drawsContainer) {
      const event = await drawContainer.getAttribute("data-event-type")

      if (!event) {
        continue
      }

      const { draw, match_type } = EVENTS[event as keyof typeof EVENTS]!

      const roundsContainers = await drawContainer.locator("div.tournament-draw__round-container").all()

      for (let i = 0; i < roundsContainers.length; i++) {
        const roundContainer = roundsContainers[i]

        if (!roundContainer) {
          continue
        }

        const dataRound = await roundContainer.getAttribute("data-round")

        const round = draw === "Main" ? MAIN_ROUNDS[dataRound as keyof typeof MAIN_ROUNDS] : `Qualifying round ${i + 1}`

        const matchCards = await roundContainer.locator("div.js-match-table").all()

        for (let i = 0; i < matchCards.length; i++) {
          const matchCard = matchCards[i]

          if (!matchCard) {
            continue
          }

          const highlights = matchCard.locator("div.match-highlights")
          const hasHighlights = (await highlights.count()) > 0
          const matchNoText = hasHighlights ? await highlights.getAttribute("data-match-id") : null

          const matchNo = matchNoText?.replace(event, "")

          const match: Partial<Match> = {
            tour: "WTA",
            format: 3,
            draw,
            match_type,
            round,
            match_no:
              hasHighlights ?
                matchNo ? Number(matchNo)
                : (i + 1) * 100
              : (i + 1) * 100,
            match_link: matchNoText ? `${eventLink}/scores/${matchNoText}` : null,
            t1_scores: [],
            t2_scores: []
          }

          const teamRows = await matchCard.locator("tr.match-table__row").all()

          for (let i = 0; i < 2; i++) {
            const teamRow = teamRows[i]
            const teamNumber = i + 1

            if (!teamRow) {
              continue
            }

            const rowClasses = await teamRow.getAttribute("class")

            if (rowClasses && rowClasses.includes("is-winner")) {
              match["winner"] = teamNumber
            }

            const entryKeyString = await teamRow.getAttribute("data-player-row-id")

            if (!entryKeyString) {
              continue
            }

            if (entryKeyString === "player") {
              match.incomplete === "B"
              continue
            }

            const entryKey = entryKeyString.replace("player-", "")

            match[`t${teamNumber}` as "t1" | "t2"] = entryKey

            const walkoverSpan = teamRow.locator("span.match-table__wo")
            const retSpan = teamRow.locator("span.match-table__ret")

            if ((await walkoverSpan.count()) > 0) {
              match.incomplete = "WO"
              continue
            } else if ((await retSpan.count()) > 0) {
              match.incomplete = "R"
            }

            const scoreCells = await teamRow.locator("td.match-table__score-cell").all()

            for (let j = 0; j < scoreCells.length; j++) {
              const scoreCell = scoreCells[j]

              if (!scoreCell) {
                continue
              }

              const setText = await getParentText(scoreCell)

              if (setText) {
                const score: Score = {
                  set_no: j + 1,
                  set: Number(setText),
                  entry: entryKey
                }

                const tbContainer = scoreCell.locator("sup.match-table__tie-break")

                if ((await tbContainer.count()) > 0) {
                  score.tb = Number(await tbContainer.innerText())
                }

                match[`t${teamNumber}_scores` as "t1_scores" | "t2_scores"]!.push(score)
              }
            }
          }

          matches.push(match as Match)
        }
      }
    }

    return matches
  } finally {
    await page.close()
  }
}
