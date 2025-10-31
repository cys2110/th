import { int, Date as NeoDate } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    edition: string
    tour: keyof typeof TourEnum
    level: LevelType
    category: string
    start_date: string
    end_date: string
    surface: string
    pm: string
    tfc: string
    currency: string
    sponsor_name: string
    s_draw: string
    d_draw: string
    qs_draw: string
    qd_draw: string
    s_link: string
    d_link: string
    qs_link: string
    qd_link: string
    site_link: string
    venues: string[] | string
    supervisors: string[] | string
    wiki_link: string
  }

  const {
    id,
    tour,
    level,
    category,
    start_date,
    end_date,
    surface,
    pm,
    tfc,
    currency,
    sponsor_name,
    s_draw,
    d_draw,
    qs_draw,
    qd_draw,
    s_link,
    d_link,
    qs_link,
    qd_link,
    site_link,
    venues,
    supervisors,
    wiki_link
  } = getQuery<QueryProps>(event)

  const startDate = start_date ? JSON.parse(start_date as string) : null
  const endDate = end_date ? JSON.parse(end_date as string) : null

  const formattedParams = {
    id,
    level,
    category: category ?? null,
    surface: surface ?? null,
    pm: pm ? int(pm) : null,
    tfc: tfc ? int(tfc) : null,
    currency: currency ?? null,
    sponsor_name: sponsor_name ?? null,
    s_draw: s_draw ?? null,
    d_draw: d_draw ?? null,
    qs_draw: qs_draw ?? null,
    qd_draw: qd_draw ?? null,
    s_link: s_link ?? null,
    d_link: d_link ?? null,
    qs_link: qs_link ?? null,
    qd_link: qd_link ?? null,
    site_link: site_link ?? null,
    start_date: startDate ? NeoDate.fromStandardDate(new Date(startDate.year, startDate.month - 1, startDate.day)) : null,
    end_date: endDate ? NeoDate.fromStandardDate(new Date(endDate.year, endDate.month - 1, endDate.day)) : null,
    tour,
    venues: venues ? (Array.isArray(venues) ? venues : [venues]) : [],
    supervisors: supervisors ? (Array.isArray(supervisors) ? supervisors : [supervisors]) : [],
    wiki_link: wiki_link ?? null
  }

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (e:Event {id: $id})
    SET e.site_link = $site_link, e.category = $category, e.sponsor_name = $sponsor_name, e.s_draw = $s_draw, e.d_draw = $d_draw, e.qs_draw = $qs_draw, e.qd_draw = $qd_draw, e.pm = $pm, e.tfc = $tfc, e.currency = $currency, e.start_date = $start_date, e.end_date = $end_date, e.s_link = $s_link, e.d_link = $d_link, e.qs_link = $qs_link, e.qd_link = $qd_link, e.wiki_link = $wiki_link, e.updated_at = date()
    CALL (e) {
      WITH [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0] AS oldTour
      WHEN oldTour <> $tour THEN {
        REMOVE e:$(oldTour) SET e:$($tour)
      }
    }
    CALL (e) {
      WITH [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0] AS oldLevel
      WHEN oldLevel <> $level THEN {
        REMOVE e:$(oldLevel) SET e:$($level)
      }
    }
    CALL (e) {
      MATCH (s:Surface {id: $surface})
      OPTIONAL MATCH (e)-[s2:ON_SURFACE]->(s1:Surface)
      WHERE s1.id <> $surface
      DELETE s2
      MERGE (e)-[:ON_SURFACE]->(s)
    }
    CALL (e) {
      OPTIONAL MATCH (e)-[v2:TOOK_PLACE_IN]->(v1:Venue)
      WHERE NOT v1.id IN $venues
      DELETE v2
      WITH e
      UNWIND $venues AS venueId
      MATCH (v:Venue {id: venueId})
      MERGE (e)-[:TOOK_PLACE_IN]->(v)
    }
    CALL (e) {
      OPTIONAL MATCH (sup:Supervisor)-[sup2:SUPERVISED]->(e)
      WHERE NOT sup.id IN $supervisors
      DELETE sup2
      WITH e
      UNWIND $supervisors AS supervisorId
      MATCH (sup:Supervisor {id: supervisorId})
      MERGE (sup)-[:SUPERVISED]->(e)
    }
    `,
    formattedParams
  )

  if (summary.counters.updates().nodesCreated === 0) {
    throw createError({ statusCode: 400, statusMessage: "Event could not be updated" })
  } else {
    return { ok: true }
  }
})
