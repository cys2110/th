import { int, Integer, Date as NeoDate, Duration as NeoDuration } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    event: string
    tour: string
    draw: string
    type: string
    round: string
    match_no: string
    court: string
    date: string
    duration: string
    umpire: string
    sets: string
    incomplete: string
    team1: string
    team2: string
    winner: string
  }

  const {
    event: id,
    tour,
    draw,
    type,
    round,
    match_no,
    sets,
    incomplete,
    winner,
    team1: entry1,
    team2: entry2,
    court,
    date,
    duration,
    umpire
  } = getQuery<QueryProps>(event)

  const matchDate = date ? JSON.parse(date as string) : null
  const [hours, minutes, secs] = duration ? (duration as string).split(":").map((x: string) => parseInt(x, 10)) : [0, 0, 0]

  const seconds = hours * 3600 + minutes * 60 + secs

  const team1: Record<string, Integer> = {}
  const team2: Record<string, Integer> = {}

  for (let i = 1; i <= 5; i++) {
    const set = getQuery(event)[`s${i}`]
    const tb = getQuery(event)[`t${i}`]
    if (set && (set as string[])[0] !== "undefined" && (set as string[])[1] !== "undefined") {
      const team1Set = parseInt((set as string[])[0])
      team1[`s${i}`] = int((set as string[])[0])
      team2[`s${i}`] = int((set as string[])[1])

      if (tb) {
        const tbNumber = parseInt(tb as string)
        if (team1Set === 7) {
          team1[`t${i}`] = int(tbNumber)
          team2[`t${i}`] = int(tbNumber < 6 ? 7 : tbNumber + 2)
        } else {
          team2[`t${i}`] = int(tbNumber)
          team1[`t${i}`] = int(tbNumber < 6 ? 7 : tbNumber + 2)
        }
      }
    }
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH (r:Round:$($draw):$($type) {round: $round}) WHERE r.id STARTS WITH $id

      OPTIONAL MATCH (f1:Entry:$($type) {id: $entry1})
      OPTIONAL MATCH (f2:Entry:$($type) {id: $entry2})

      MERGE (m:Match:$($tour):$($draw):$($type) {id: $matchId, match_no: $match_no})
      MERGE (m)-[:PLAYED]->(r)
      SET m.incomplete = $incomplete, m.court = $court, m.date = $date, m.duration = $duration

      CALL (m) {
        WHEN $umpire IS NOT NULL THEN {
          MATCH (u:Umpire {id: $umpire})
          MERGE (u)-[:UMPIRED]->(m)
        }
      }

      CALL (m) {
        WHEN $incomplete IS NULL THEN {
          SET m:$($sets)
        }
      }

      CALL (*) {
        WHEN $entry1 IS NOT NULL THEN {
          MERGE (s1:Score:$($type):$($tour):$($draw):T1 {id: m.id || ' ' || $entry1})
          MERGE (f1)-[:SCORED]->(s1)
          MERGE (s1)-[:SCORED]->(m)
          CALL (s1) {
            WHEN $winner IS NOT NULL AND $winner = 'Team 1' THEN SET s1:Winner
            WHEN $winner IS NOT NULL THEN SET s1:Loser
          }
          CALL (s1) {
            WHEN $team1 IS NOT NULL THEN SET s1 += $team1
          }
        }
      }
      CALL (*) {
        WHEN $entry2 IS NOT NULL THEN {
          MERGE (s2:Score:$($type):$($tour):$($draw):T2 {id: m.id || ' ' || $entry2})
          MERGE (f2)-[:SCORED]->(s2)
          MERGE (s2)-[:SCORED]->(m)
          CALL (s2) {
            WHEN $winner IS NOT NULL AND $winner = 'Team 2' THEN SET s2:Winner
            WHEN $winner IS NOT NULL THEN SET s2:Loser
          }
          CALL (s2) {
            WHEN $team2 IS NOT NULL THEN SET s2 += $team2
          }
        }
      }
    `,
    {
      id,
      type,
      tour,
      draw,
      round,
      matchId: `${id} ${type.charAt(0)} ${draw.charAt(0)} ${match_no}`,
      match_no: int(match_no),
      sets: sets ?? null,
      incomplete: incomplete ?? null,
      team1: Object.keys(team1).length ? team1 : null,
      team2: Object.keys(team2).length ? team2 : null,
      winner: winner ?? null,
      entry1: entry1 ?? null,
      entry2: entry2 ?? null,
      court: court ?? null,
      date: matchDate ? NeoDate.fromStandardDate(new Date(matchDate.year, matchDate.month - 1, matchDate.day)) : null,
      duration: new NeoDuration(0, 0, seconds, 0),
      umpire: umpire ?? null
    }
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Match could not be created" })
  } else {
    return { ok: true }
  }
})
