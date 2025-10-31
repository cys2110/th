import { int, Date as NeoDate } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    tournament: string
    year: string
    tours: (keyof typeof TourEnum)[]
    start_date: any
    end_date: any
    sponsor_name: string
    surface: string
    currency: string
    tfc: string
    draw_type: string
    draw_link: string
    category: string
    wiki_link: string
    venues: string | string[]
  }
  const {
    id,
    tournament,
    year,
    start_date,
    end_date,
    tfc,
    venues,
    tours,
    sponsor_name,
    surface,
    currency,
    draw_type,
    draw_link,
    category,
    wiki_link
  } = getQuery<QueryProps>(event)

  const startDate = start_date ? JSON.parse(start_date as string) : null
  const endDate = end_date ? JSON.parse(end_date as string) : null

  const formattedParams = {
    id: int(id),
    tournament: int(tournament),
    year: int(year),
    tfc: int(tfc),
    venues: venues ? (Array.isArray(venues) ? venues : [venues]) : [],
    tours: tours ? (Array.isArray(tours) ? tours : [tours]) : [],
    start_date: startDate ? NeoDate.fromStandardDate(new Date(startDate.year, startDate.month - 1, startDate.day)) : null,
    end_date: endDate ? NeoDate.fromStandardDate(new Date(endDate.year, endDate.month - 1, endDate.day)) : null,
    sponsor_name: sponsor_name || null,
    surface: surface || null,
    currency: currency || null,
    draw_type: draw_type || null,
    draw_link: draw_link || null,
    category: category || null,
    wiki_link: wiki_link || null
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (t:Tournament {id: $tournament})
    MATCH (y:Year {id: $year})
    MERGE (e:Edition:$($tours) {id: $id})
    MERGE (e)-[:EDITION_OF]->(t)
    MERGE (e)-[:IN_YEAR]->(y)
    SET e.wiki_link = $wiki_link, e.category = $category, e.sponsor_name = $sponsor_name, e.draw_type = $draw_type, e.draw_link = $draw_link, e.currency = $currency, e.tfc = $tfc, e.start_date = $start_date,
    e.end_date = $end_date, e.updated_at = date()
    CALL (e) {
      WHEN $surface IS NOT NULL THEN {
        MATCH (s:Surface {id: $surface})
        MERGE (e)-[:ON_SURFACE]->(s)
      }
    }
    CALL (e) {
      WHEN size($venues) > 0 THEN {
        UNWIND $venues AS venue
        MATCH (v:Venue {id: venue})
        MERGE (e)-[:TOOK_PLACE_IN]->(v)
      }
    }
    `,
    formattedParams
  )

  console.log(
    `Notifications for edition creation: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Edition could not be created" })
  } else {
    return { ok: true }
  }
})
