import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { SupabaseClient } from "@supabase/supabase-js"
import { chromium, Page } from "playwright"
import type { Database } from "~/types/database.types"

type DrawPlayer = {
  id: string
  name: string
}

async function writeMissingPlayers(players: Array<DrawPlayer>) {
  const filePath = resolve(process.cwd(), "public/missing-players.json")
  const contents = await readFile(filePath, "utf8")
  const existingPlayers: Array<DrawPlayer> = contents.trim() ? JSON.parse(contents) : []
  const missingPlayers = Array.from(new Map([...existingPlayers, ...players].map(player => [player.id, player])).values())

  await writeFile(filePath, `${JSON.stringify(missingPlayers, null, 2)}\n`)
}

const checkForMissingPlayers = async (supabase: SupabaseClient<Database>, page: Page) => {
  try {
    const drawPlayers: Array<{ id: string; name: string }> = []

    await acceptCookies(page)

    const players = await page.locator(".name").all()

    for (const player of players) {
      const link = player.locator("a")

      if ((await link.count()) > 0) {
        const id = await link.getAttribute("href")
        const name = await link.innerText()

        if (id) {
          const result = parsePlayerLink(id)

          if (result && !drawPlayers.find(p => p.id === result))
            drawPlayers.push({
              id: result,
              name
            })
        } else {
          return {
            success: false,
            error: "Error parsing player link",
            link: id
          }
        }
      }
    }

    // Check that all players are in supabase already
    const { data, error } = await supabase
      .schema("tennis")
      .from("player")
      .select("id")
      .in(
        "id",
        drawPlayers.map(player => player.id)
      )

    if (error || !data) {
      console.error("Error fetching players:", error)
      return {
        success: false,
        error: "Error fetching players"
      }
    }

    const playersNotInSupabase = drawPlayers.filter(p => !data.find(player => player.id === p.id))

    if (playersNotInSupabase.length > 0) {
      await writeMissingPlayers(playersNotInSupabase)

      return {
        success: false,
        error: "Missing players",
        missingPlayers: playersNotInSupabase
      }
    }

    return {
      success: true
    }
  } catch {
    return {
      success: false,
      error: "Error checking for missing players"
    }
  }
}

const parseMatchLink = (link: string) => {
  // Get last segment of link
  const matchId = link.split("/").pop()

  // Replace text and return the remaining number only
  return Number(matchId?.replace(/[^0-9]/g, ""))
}

const getDrawMatches = async (page: Page, drawType: string) => {
  const matches = []
  const entries: Record<string, any> = {}
  let matchNo = 0

  const drawContainers = await page.locator(".draw").all()

  // Start with last draw container since this is the final
  for (let i = drawContainers.length - 1; i >= 0; i--) {
    const round = await drawContainers[i]?.locator(".draw-header").innerText()
    const drawMatches = await drawContainers[i]?.locator(".draw-stats").all()

    if (!drawMatches) continue

    for (const match of drawMatches) {
      const matchDetails: Record<string, any> = {
        draw_type: drawType.includes("Qual") ? "Qualifying" : "Main",
        match_type: drawType.includes("Singles") ? "Singles" : "Doubles",
        round,
        t1: {
          players: [],
          scores: []
        },
        t2: {
          players: [],
          scores: []
        }
      }

      const matchLink = match.getByRole("link", { name: "Stats" })
      let matchId = 0

      if ((await matchLink.count()) > 0) {
        const href = await matchLink.getAttribute("href")

        if (href) {
          matchDetails.link = `https://www.atptour.com${href}`
          matchId = parseMatchLink(href)
        }
      }

      matchNo = matchId || matchNo + 1
      matchDetails.match_no = matchNo

      const teamContainers = await match.locator(".stats-item").all()

      for (let i = 0; i < teamContainers.length; i++) {
        const teamContainer = teamContainers[i]

        if (!teamContainer) continue

        // Select all the name containers - doubles teams will have two where as singles teams will only have one
        const playerContainers = await teamContainer.locator(".name").all()
        let seed: number | null = null
        let entryInfo: string | null = null

        for (const playerContainer of playerContainers) {
          const playerLink = playerContainer.locator("a")
          if ((await playerLink.count()) > 0) {
            const id = await playerLink.getAttribute("href")
            const name = await playerLink.innerText()

            if (id) {
              const result = parsePlayerLink(id)

              if (result) {
                matchDetails[`t${i + 1}`].players.push({
                  id: result,
                  name
                })
              }
            }
          } else {
            matchDetails.bye = true
          }

          const entryInfoContainer = playerContainer.locator("span")

          if ((await entryInfoContainer.count()) > 0) {
            // Get entry info text and strip out parentheses
            const entryInfoString = await entryInfoContainer.innerText().then(text => text.replace("(", "").replace(")", ""))

            if (isNaN(Number(entryInfoString))) {
              entryInfo = entryInfoString
            } else {
              seed = Number(entryInfoString)
            }
          }
        }

        matchDetails.t1.entryKey = matchDetails.t1.players.map((p: any) => p.id).join("-")
        matchDetails.t2.entryKey = matchDetails.t2.players.map((p: any) => p.id).join("-")

        entries[matchDetails[`t${i + 1}`].players.map((p: any) => p.id).join("-")] = {
          seed,
          entryInfo,
          players: matchDetails[`t${i + 1}`].players,
          match_type: matchDetails[`t${i + 1}`].players.length > 1 ? "Doubles" : "Singles",
          draw: drawType.includes("Qual") ? "Qualifying" : "Main"
        }

        matchDetails[`t${i + 1}`].entryKey = matchDetails[`t${i + 1}`].players.map((p: any) => p.id).join("-")

        // If team container has an icon-checkmark span, then this is the winning team
        const iconCheckmark = teamContainer.locator(".icon-checkmark")

        if ((await iconCheckmark.count()) > 0) {
          matchDetails.winner = i + 1
        }

        const scoreContainers = await teamContainer.locator(".score-item").all()

        for (let j = 0; j < scoreContainers.length; j++) {
          const scoreContainer = scoreContainers[j]

          if (scoreContainer) {
            const scoreSpans = await scoreContainer.locator("span").all()
            const setScore = scoreSpans[0]
            const tbScore = scoreSpans[1]

            if (setScore && (await setScore.innerText())) {
              const set = Number(await setScore.innerText())
              let tb

              if (tbScore && (await tbScore.innerText())) {
                tb = Number(await tbScore.innerText())
              }

              matchDetails[`t${i + 1}`].scores.push({
                set_no: j + 1,
                set,
                tb
              })
            }
          }
        }
      }

      matches.push(matchDetails)
    }
  }

  return { matches, entries }
}

const getResultMatches = async (page: Page) => {
  const matches: Array<Record<string, string>> = []
  const months: Record<string, string> = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12"
  }
  const formatDate = (value: string) => {
    const dateParts = value.match(/^[A-Za-z]{3},\s+(\d{1,2})\s+([A-Za-z]+),\s+(\d{4})$/)
    const month = dateParts?.[2] ? months[dateParts[2]] : undefined

    if (!dateParts?.[1] || !month || !dateParts[3]) {
      throw new Error(`Unable to parse result date: ${value}`)
    }

    return `${dateParts[3]}-${month}-${dateParts[1].padStart(2, "0")}`
  }

  const accordionItems = await page.locator(".atp_accordion-item").all()

  for (const accordionItem of accordionItems) {
    const header = await getParentText(accordionItem.locator("h4"))

    const resultMatches = await accordionItem.locator(".match").all()

    for (const resultMatch of resultMatches) {
      const match: Record<string, string> = {
        date: formatDate(header)
      }

      const matchHeader = await resultMatch.locator(".match-header").locator("span").all()

      const matchInfo = matchHeader[0]

      if (matchInfo && (await matchInfo.count()) > 0) {
        const info = await matchInfo.innerText()

        if (info) {
          const infoParts = info.split(/\s+-\s+/, 2)

          if (infoParts[0]) {
            match.round = infoParts[0].trim()
          }

          if (infoParts[1]) {
            match.court = infoParts[1].trim()
          }
        }
      }

      const matchDuration = matchHeader[1]

      if (matchDuration && (await matchDuration.count()) > 0) {
        match.duration = await matchDuration.innerText()
      }

      const matchUmpire = resultMatch.locator(".match-umpire")

      if ((await matchUmpire.count()) > 0) {
        const umpireText = await matchUmpire.innerText()

        if (umpireText) {
          match.umpire = umpireText.trim().replace("Ump: ", "")
        }
      }

      // Get players to match to matches
      const statItems = await resultMatch.locator(".stats-item").all()

      for (let i = 0; i < statItems.length; i++) {
        const statItem = statItems[i]

        if (statItem) {
          const playerContainers = await statItem.locator(".name").all()

          const key: string[] = []

          for (const playerContainer of playerContainers) {
            const link = playerContainer.locator("a")

            if (link && (await link.count()) > 0) {
              const href = await link.getAttribute("href")

              if (href) {
                const playerId = parsePlayerLink(href)

                if (playerId) key.push(playerId)
              }
            }
          }

          match[`t${i + 1}`] = key.join("-")
        }
      }

      matches.push(match)
    }
  }

  return matches
}

const mergeResultMatches = (drawMatches: Array<Record<string, any>>, resultMatches: Array<Record<string, string>>) => {
  const normalizeTeamKey = (key: string) => key.split("-").sort().join("-")
  const matchedDraws = new Set<Record<string, any>>()

  for (const resultMatch of resultMatches) {
    const resultTeams = [normalizeTeamKey(resultMatch.t1 || ""), normalizeTeamKey(resultMatch.t2 || "")].sort()
    const candidates = drawMatches.filter(match => {
      const drawTeams = [normalizeTeamKey(match.t1.entryKey), normalizeTeamKey(match.t2.entryKey)].sort()

      return !matchedDraws.has(match) && drawTeams[0] === resultTeams[0] && drawTeams[1] === resultTeams[1]
    })
    const drawMatch = candidates.find(match => match.round?.trim().toLowerCase() === resultMatch.round?.toLowerCase()) || candidates[0]

    if (drawMatch) {
      const { t1: _t1, t2: _t2, round: _round, ...matchDetails } = resultMatch

      Object.assign(drawMatch, matchDetails)
      matchedDraws.add(drawMatch)
    }
  }
}

export async function scrapeAtpDraw(
  supabase: SupabaseClient<Database>,
  tournamentId: string,
  year: string,
  format: string = "3",
  superTiebreak?: boolean
) {
  const browser = await chromium.launch({ headless: false })

  try {
    const allMatches: Array<Record<string, any>> = []
    const entries: Record<string, any> = {}

    const page = await browser.newPage()

    await page.goto(`https://www.atptour.com/en/scores/archive/x/${tournamentId}/${year}/draws`)

    const matchTypeButtons = await page.locator(".atp_draw").locator(".tab-switcher-link").all()

    // Navigate to each draw page
    for (const matchTypeButton of matchTypeButtons) {
      const drawType = await matchTypeButton.innerText()
      const href = await matchTypeButton.getAttribute("href")

      if (href) {
        const context = await browser.newContext()
        const newPage = await context.newPage()

        try {
          await newPage.goto(new URL(href, page.url()).href)

          const missingPlayersCheck = await checkForMissingPlayers(supabase, newPage)

          if (!missingPlayersCheck.success) {
            return {
              success: false,
              error: missingPlayersCheck.error,
              missingPlayers: missingPlayersCheck.missingPlayers
            }
          }

          const draw = await getDrawMatches(newPage, drawType)

          allMatches.push(...draw.matches)
          Object.assign(entries, draw.entries)
        } finally {
          await context.close()
        }
      }
    }

    const singlesResultsContext = await browser.newContext()
    const singlesNewPage = await singlesResultsContext.newPage()

    try {
      // Go to results page
      await singlesNewPage.goto(`https://www.atptour.com/en/scores/archive/x/${tournamentId}/${year}/results`)

      const singlesMatches = await getResultMatches(singlesNewPage)
      mergeResultMatches(allMatches, singlesMatches)
    } finally {
      await singlesResultsContext.close()
    }

    const doublesResultsContext = await browser.newContext()
    const doublesNewPage = await doublesResultsContext.newPage()

    try {
      // Go to results page
      await doublesNewPage.goto(`https://www.atptour.com/en/scores/archive/x/${tournamentId}/${year}/results?matchType=doubles`)

      const doublesMatches = await getResultMatches(doublesNewPage)
      mergeResultMatches(allMatches, doublesMatches)
    } finally {
      await doublesResultsContext.close()
    }

    const { data: editionData, error: editionError } = await supabase
      .schema("tennis")
      .from("editions")
      .select("id, tournament!inner(id)")
      .eq("tournament.mens_id", Number(tournamentId))
      .eq("year", Number(year))
      .single()

    if (editionError || !editionData) {
      console.error("Error fetching edition:", editionError)

      return {
        success: false,
        error: "Error fetching edition"
      }
    }

    const { data: eventData, error: eventError } = await supabase
      .schema("tennis")
      .from("events")
      .select("id")
      .eq("edition_id", editionData.id)
      .single()

    if (eventError || !eventData) {
      console.error("Error fetching event:", eventError)

      return {
        success: false,
        error: "Error fetching event"
      }
    }

    const eventId = eventData.id

    const { data: roundData, error: roundError } = await supabase
      .schema("tennis")
      .from("rounds")
      .select("id, round, match_type, draw")
      .eq("event_id", eventId)

    if (roundError || !roundData) {
      console.error("Error fetching round:", roundError)

      return {
        success: false,
        error: "Error fetching rounds"
      }
    }

    const { data: umpireData, error: umpireError } = await supabase
      .schema("tennis")
      .from("people")
      .select("id, full_name")
      .in(
        "full_name",
        allMatches.filter(match => match.umpire).map(match => match.umpire)
      )

    if (umpireError || !umpireData) {
      console.error("Error fetching umpire:", umpireError)

      return {
        success: false,
        error: "Error fetching umpires"
      }
    }

    for (const entry of Object.entries(entries)) {
      const [entryKey, entryValue] = entry

      // Insert entries
      const { data: entryData, error: entryError } = await supabase
        .schema("tennis")
        .from("entries")
        .insert({
          match_type: entryValue.match_type,
          event_id: eventId,
          entry_key: entryKey
        })
        .select("id, entry_key")

      if (entryError || !entryData?.length) {
        console.error("Error inserting entry:", entryError)

        return {
          success: false,
          error: "Error inserting entry"
        }
      }

      entries[entryKey].entry_id = entryData[0]!.id
    }

    // Insert player_entry_mapping
    const { error: playerEntryMappingError } = await supabase
      .schema("tennis")
      .from("player_entry_mapping")
      .insert(
        Object.values(entries).flatMap(entry =>
          entry.players.map((player: any, index: number) => ({
            player_id: player.id,
            entry_id: entry.entry_id,
            player_order: index + 1
          }))
        )
      )

    if (playerEntryMappingError) {
      console.error("Error inserting player entry mapping:", playerEntryMappingError)

      return {
        success: false,
        error: "Error inserting player entry mapping"
      }
    }

    // Insert seeds
    const { error: seedsError } = await supabase
      .schema("tennis")
      .from("seeds")
      .insert(
        Object.values(entries)
          .filter(entry => entry.seed)
          .map(entry => ({
            event_id: eventId,
            entry_id: entry.entry_id,
            seed: entry.seed,
            match_type: entry.match_type,
            draw: entry.draw
          }))
      )

    if (seedsError) {
      console.error("Error inserting seeds:", seedsError)

      return {
        success: false,
        error: "Error inserting seeds"
      }
    }

    // Insert entry_info
    const { error: entryInfoError } = await supabase
      .schema("tennis")
      .from("entry_status")
      .insert(
        Object.values(entries)
          .filter(entry => entry.entryInfo)
          .map(entry => ({
            event_id: eventId,
            entry_id: entry.entry_id,
            status: entry.entryInfo,
            draw: entry.draw
          }))
      )

    if (entryInfoError) {
      console.error("Error inserting entry info:", entryInfoError)

      return {
        success: false,
        error: "Error inserting entry info"
      }
    }

    // Insert matches
    for (const match of allMatches) {
      const t1Id = entries[match.t1.entryKey]?.entry_id
      const t2Id = entries[match.t2.entryKey]?.entry_id

      const { data: matchData, error: matchError } = await supabase
        .schema("tennis")
        .from("matches")
        .insert({
          match_no: match.match_no,
          court: match.court,
          date: match.date,
          tour: "ATP",
          match_type: match.match_type,
          draw: match.draw_type,
          format: Number(format),
          duration: match.duration,
          incomplete: match.bye ? "B" : null,
          round_id:
            roundData.find(
              round =>
                (match.round === "1st Round Qualifying" ? round.round === "Qualifying round 1" : round.round === match.round) &&
                round.draw === match.draw_type &&
                round.match_type === match.match_type
            )?.id || "",
          team_1_id: t1Id,
          team_2_id: t2Id,
          winner_id: match.winner === 1 ? t1Id : t2Id,
          loser_id: match.winner === 2 ? t1Id : t2Id,
          umpire_id: umpireData.find(umpire => umpire.full_name === match.umpire)?.id,
          match_link: match.link
        })
        .select("id")

      if (matchError || !matchData?.length) {
        console.error("Error inserting match:", matchError)

        return {
          success: false,
          error: "Error inserting match"
        }
      }

      // Add match_id to match item
      match.match_id = matchData[0]!.id
      match.t1.entry_id = t1Id
      match.t2.entry_id = t2Id
    }

    // Insert match_scores
    const { error: matchScoresError } = await supabase
      .schema("tennis")
      .from("match_scores")
      .insert(
        allMatches.flatMap(match => {
          const t1Scores = match.t1.scores.map((score: any) => ({
            match_id: match.match_id,
            entry_id: match.t1.entry_id,
            set_no: score.set_no,
            set: score.set,
            tb: score.tb
          }))
          const t2Scores = match.t2.scores.map((score: any) => ({
            match_id: match.match_id,
            entry_id: match.t2.entry_id,
            set_no: score.set_no,
            set: score.set,
            tb: score.tb
          }))

          return [...t1Scores, ...t2Scores]
        })
      )

    if (matchScoresError) {
      console.error("Error inserting match scores:", matchScoresError)

      return {
        success: false,
        error: "Error inserting match scores"
      }
    }

    return {
      success: true,
      draw: "ATP",
      allMatches,
      entries
    }
  } finally {
    await browser.close()
  }
}
