import { int, Date as NeoDate, Duration as NeoDuration } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    tour: string
    draw: string
    type: string
    match_no: string
    incomplete: string
    court: string
    date: any
    duration: string
    umpire: string
  }

  const { id, tour, draw, type, match_no, incomplete, court, date, duration, umpire } = getQuery<QueryProps>(event)

  const matchDate = date ? JSON.parse(date as string) : null
  const [hours, minutes, secs] = duration ? (duration as string).split(":").map((x: string) => parseInt(x, 10)) : [0, 0, 0]

  const seconds = hours * 3600 + minutes * 60 + secs

  const formattedParams = {
    id,
    match_no: int(match_no),
    court: court ?? null,
    date: matchDate ? NeoDate.fromStandardDate(new Date(matchDate.year, matchDate.month - 1, matchDate.day)) : null,
    incomplete: incomplete ?? null,
    duration: new NeoDuration(0, 0, seconds, 0),
    umpire: umpire ?? null,
    labels: [tour, draw, type]
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (m:Match:$($labels) {id: $id})
    SET m.match_no = $match_no, m.court = $court, m.date = $date, m.incomplete = $incomplete, m.duration = $duration
    CALL (m) {
      WHEN $umpire IS NOT NULL THEN {
        MATCH (u:Umpire {id: $umpire})
        MERGE (u)-[:UMPIRED]->(m)
      }
    }
    RETURN m
    `,
    formattedParams
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Match could not be updated" })
  } else {
    return { ok: true }
  }
})
