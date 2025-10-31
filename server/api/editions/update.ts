import { int, Date as NeoDate } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    tournament: SelectOptionsType
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
    venues: SelectOptionsType[] | SelectOptionsType
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
    tournament: int(tournament.value),
    year: int(year),
    tfc: int(tfc),
    venues: venues ? (Array.isArray(venues) ? venues.map(v => v.value) : [venues.value]) : [],
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
    MATCH (t:Tournament)<-[t1:EDITION_OF]-(e:Edition {id: $id})-[:IN_YEAR]->(y:Year)
    OPTIONAL MATCH (e)-[s1:ON_SURFACE]->(s:Surface)
    OPTIONAL MATCH (e)-[v1:TOOK_PLACE_IN]->(v:Venue)
    SET e.wiki_link = $wiki_link, e.category = $category, e.sponsor_name = $sponsor_name, e.draw_type = $draw_type, e.draw_link = $draw_link, e.currency = $currency, e.tfc = $tfc, e.start_date = $start_date,
    e.end_date = $end_date, e.updated_at = date()
    CALL (e, t) {
      WHEN t.id <> $tournament THEN {
        MATCH (newT:Tournament {id: $tournament})
        mERGE (e)-[:EDITION_OF]->(newT)
        DELETE t1
      }
    }
    CALL (e, y) {
      WHEN y.id <> $year THEN {
        MATCH (newY:Year {id: $year})
        MERGE (e)-[:IN_YEAR]->(newY)
        DELETE y1
      }
    }
    CALL (e) {
      WITH [x IN $tours WHERE NOT x IN labels(e)] AS add, [x IN labels(e) WHERE NOT x IN $tours AND x <> 'Edition'] AS remove
      REMOVE e:$(remove) SET e:$(add)
    }
    CALL (e, s, s1) {
      WHEN $surface IS NOT NULL THEN {
        MATCH (newS:Surface {id: $surface})
        CALL (*) {
          WHEN s IS NOT NULL AND s.id <> newS.id THEN {
            MERGE (e)-[:ON_SURFACE]->(newS)
            DELETE s1
          }
          ELSE MERGE (e)-[:ON_SURFACE]->(newS)
        }
      }
      WHEN $surface IS NULL AND s IS NOT NULL THEN DELETE s1
    }
    WITH e, v1, v, COLLECT(DISTINCT v.id) AS venue_ids
    WHERE [x IN venue_ids WHERE NOT x IN $venues]
    DELETE v1
    CALL (e) {
      UNWIND $venues AS venue
      MATCH (newV:Venue {id: venue})
      MERGE (e)-[:TOOK_PLACE_IN]->(newV)
    }
    `,
    formattedParams
  )

  if (summary.counters.updates().nodesCreated === 0) {
    throw createError({ statusCode: 400, statusMessage: "Edition could not be updated" })
  } else {
    return { ok: true }
  }
})
