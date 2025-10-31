import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    edition: string
    tour: keyof typeof TourEnum
    round: keyof typeof RoundEnum
    type: MatchType
    draw: DrawType
    number: string
    points: string
    pm: string
  }

  const { edition, tour, round, type, draw, number, points, pm } = getQuery<QueryProps>(event)

  const formattedParams = {
    eventId: `${edition}-${tour}`,
    id: `${edition}-${tour} ${RoundEnum[round]}`,
    labels: [type, draw, tour],
    number: int(number),
    points: points ? int(points) : null,
    pm: pm ? (Number.isInteger(Number(pm)) ? int(pm) : pm) : null,
    round
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $eventId})
    MERGE (r:Round:$($labels) {id: $id, number: $number, round: $round})
    SET r.points = $points, r.pm = $pm
    MERGE (r)-[:ROUND_OF]->(e)
    `,
    formattedParams
  )

  console.log(
    `Notifications for round creation: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Round could not be created" })
  } else {
    return { ok: true }
  }
})
