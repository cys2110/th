import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    tour: keyof typeof TourEnum
    round: keyof typeof RoundEnum
    type: MatchType
    draw: DrawType
    number: string
    points: string
    pm: string
  }

  const { id, tour, round, type, draw, number, points, pm } = getQuery<QueryProps>(event)

  const formattedParams = {
    id,
    labels: [type, draw, tour],
    number: int(number),
    points: points ? int(points) : null,
    pm: pm ? (Number.isInteger(Number(pm)) ? int(pm) : pm) : null,
    round
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (r:Round:$($labels) {id: $id})
    SET r.points = $points, r.pm = $pm, r.number = $number
    `,
    formattedParams
  )

  console.log(
    `Notifications for round update: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Round could not be updated" })
  } else {
    return { ok: true }
  }
})
