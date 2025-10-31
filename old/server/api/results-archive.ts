import { int, Date as NeoDate } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    skip: string
    filters: any
  }
  const { skip, filters } = getQuery<QueryProps>(event)

  const { tournaments, levels, categories, dateRange, environment, surfaces, venues, countries, supervisors, umpires, tours, year } =
    JSON.parse(filters)

  const levelCategories = []

  if (levels?.includes("Tour")) levelCategories.push(TOUR_CATEGORIES)
  if (levels?.includes("Challenger")) levelCategories.push(CHALLENGER_CATEGORIES)
  if (levels?.includes("ITF")) levelCategories.push(ITF_CATEGORIES)

  const formattedParams = {
    skip: int(skip),
    year: year ? int(year) : null,
    categories,
    tournaments: tournaments.map((t: any) => int(t.id)),
    umpires: umpires.map((u: any) => u.id),
    supervisors: supervisors.map((s: any) => s.id),
    surfaces: surfaces,
    venues: venues.map((v: any) => v.id),
    countries: countries.map((c: any) => c.id),
    levels: levelCategories.flat(),
    environment: environment ?? null,
    tours: tours.map((t: any) => (typeof t === "string" ? t : t.value)),
    start: dateRange.start ? NeoDate.fromStandardDate(new Date(dateRange.start.year, dateRange.start.month - 1, dateRange.start.day)) : null,
    end: dateRange.end ? NeoDate.fromStandardDate(new Date(dateRange.end.year, dateRange.end.month - 1, dateRange.end.day)) : null
  }

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    CALL () {
      MATCH (y:Year WHERE $year IS NULL OR y.id = $year)<-[:IN_YEAR]-(e:Event)-[:EDITION_OF]->(t:Tournament WHERE SIZE($tournaments) = 0 OR t.id IN $tournaments)
        WHERE ((SIZE($surfaces) = 0 AND $environment IS NULL) OR EXISTS {
          MATCH (e)-[:ON_SURFACE]->(s:Surface WHERE (SIZE($surfaces) = 0 OR s.surface IN $surfaces) AND ($environment IS NULL OR s.environment = $environment))
        }) AND
        ((SIZE($venues) = 0 AND SIZE($countries) = 0) OR EXISTS {
          MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue WHERE SIZE($venues) = 0 OR v.id IN $venues)-[:LOCATED_IN]->(country:Country WHERE SIZE($countries) = 0 OR country.id IN $countries)
        }) AND
        (SIZE($supervisors) = 0 OR EXISTS {
          MATCH (sup:Supervisor WHERE sup.id IN $supervisors)-[:SUPERVISED]->(e)
        }) AND
        (SIZE($tours) = 0 OR ANY(tour IN $tours WHERE tour IN labels(e))) AND
        (SIZE($umpires) = 0 OR EXISTS {
          MATCH (u:Umpire WHERE u.id IN $umpires)-[:UMPIRED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(e)
        }) AND
        ($start IS NULL OR ANY(date IN [e.start_date, e.atp_start_date, e.wta_start_date, e.men_start_date, e.women_start_date] WHERE date IS NOT NULL AND date >= $start)) AND
        ($end IS NULL OR ANY(date IN [e.end_date, e.atp_end_date, e.wta_end_date, e.men_end_date, e.women_end_date] WHERE date IS NOT NULL AND date <= $end)) AND
        ((SIZE($categories) = 0 AND SIZE($levels) = 0) OR ANY(cat IN $categories WHERE cat IN [e.category, e.atp_category, e.wta_category, e.men_category, e.women_category]) OR ANY(level IN $levels WHERE level IN [e.category, e.atp_category, e.wta_category, e.men_category, e.women_category]))
      RETURN COUNT (e) AS count
    }
    CALL () {
      MATCH (y:Year WHERE $year IS NULL OR y.id = $year)<-[:IN_YEAR]-(e:Event)-[:EDITION_OF]->(t:Tournament WHERE SIZE($tournaments) = 0 OR t.id IN $tournaments)
        WHERE
        (SIZE($tours) = 0 OR ANY(tour IN $tours WHERE tour IN labels(e))) AND
        ($start IS NULL OR ANY(date IN [e.start_date, e.atp_start_date, e.wta_start_date, e.men_start_date, e.women_start_date] WHERE date IS NOT NULL AND date >= $start)) AND
        ($end IS NULL OR ANY(date IN [e.end_date, e.atp_end_date, e.wta_end_date, e.men_end_date, e.women_end_date] WHERE date IS NOT NULL AND date <= $end)) AND
        ((SIZE($categories) = 0 AND SIZE($levels) = 0) OR ANY(cat IN $categories WHERE cat IN [e.category, e.atp_category, e.wta_category, e.men_category, e.women_category]) OR ANY(level IN $levels WHERE level IN [e.category, e.atp_category, e.wta_category, e.men_category, e.women_category]))
        CALL (e) {
          OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)
          RETURN properties(s) AS surface
        }
        CALL (e) {
          OPTIONAL MATCH (s)-[:SUPERVISED]->(e)
          RETURN COLLECT(properties(s)) AS supervisors
        }
        CALL (e) {
          OPTIONAL MATCH (u:Umpire)-[:UMPIRED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(e)
          RETURN COLLECT(DISTINCT properties(u)) AS umpires
        }
        CALL (e) {
          OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
          RETURN COLLECT(DISTINCT properties(v)) AS venues, COLLECT(DISTINCT properties(c)) AS countries
        }
        WITH e, y, t, surface, supervisors, venues, [x IN venues | x.id] AS venue_ids, countries, [x IN countries | x.id] AS country_ids, umpires, [x in supervisors | x.id] AS supervisor_ids, [x IN umpires | x.id] AS umpire_ids, head(
          apoc.coll.sort(
            [
              x IN
              [
                e.start_date,
                e.atp_start_date,
                e.wta_start_date,
                e.men_start_date,
                e.women_start_date
              ]
              WHERE x IS NOT NULL
            ])) AS start_date
        WHERE
          (SIZE($surfaces) = 0 OR surface.surface IN $surfaces) AND
          ($environment IS NULL OR surface.environment = $environment) AND
          (SIZE($supervisors) = 0 OR ( size(supervisors) > 0 AND ANY(id IN $supervisors WHERE id IN supervisor_ids) )) AND
          (SIZE($umpires) = 0 OR ( size(umpires) > 0 AND ANY(id IN $umpires WHERE id IN umpire_ids) )) AND
          (SIZE($venues) = 0 OR ( size(venues) > 0 AND ANY(id IN $venues WHERE id IN venue_ids) )) AND
          (SIZE($countries) = 0 OR ( size(countries) > 0 AND ANY(id IN $countries WHERE id IN country_ids) ))
        ORDER BY y.id DESC, start_date DESC, t.name
        SKIP $skip
        LIMIT 40
        RETURN apoc.map.clean(apoc.map.merge(properties(e), {
          surface: surface,
          venues: venues,
          countries: countries,
          tournament: properties(t),
          year: y.id,
          tours: [x IN labels(e) WHERE NOT x IN ['Event', 'Update']],
          update: CASE WHEN e:Update THEN true ELSE false END,
          supervisors: supervisors,
          umpires: umpires
        }) , [], [null]) AS event
    }
    RETURN count, event
    `,
    formattedParams
  )

  // Convert Neo4j types to standard JavaScript types
  const events = records.map(record => {
    const event: any = record.get("event")
    const dateKeys: (keyof typeof event)[] = [
      "start_date",
      "end_date",
      "atp_start_date",
      "atp_end_date",
      "wta_start_date",
      "wta_end_date",
      "men_start_date",
      "men_end_date",
      "women_start_date",
      "women_end_date"
    ]

    for (const key of dateKeys) {
      if (event[key]) event[key] = event[key].toStandardDate().toISOString().slice(0, 10)
    }

    const {
      category,
      atp_category,
      wta_category,
      men_category,
      women_category,
      id,
      start_date,
      end_date,
      atp_start_date,
      atp_end_date,
      wta_start_date,
      wta_end_date,
      men_start_date,
      men_end_date,
      women_start_date,
      women_end_date,
      draw_type,
      atp_draw_s,
      atp_draw_d,
      wta_draw_s,
      wta_draw_d,
      men_draw_s,
      men_draw_d,
      women_draw_s,
      women_draw_d,
      tournament,
      year,
      ...rest
    } = event

    // level
    const levels = []

    if (
      category ||
      (atp_category && !ATP_CHALLENGER_CATEGORIES.includes(atp_category)) ||
      (wta_category && !WTA_CHALLENGER_CATEGORIES.includes(wta_category))
    )
      levels.push("Tour")

    if ((atp_category && ATP_CHALLENGER_CATEGORIES.includes(atp_category)) || (wta_category && WTA_CHALLENGER_CATEGORIES.includes(wta_category)))
      levels.push("Challenger")

    if (men_category || women_category) levels.push("ITF")

    return {
      id: id.toInt(),
      levels,
      categories: [category, atp_category, wta_category, men_category, women_category],
      dates: [
        [start_date, end_date],
        [atp_start_date, atp_end_date],
        [wta_start_date, wta_end_date],
        [men_start_date, men_end_date],
        [women_start_date, women_end_date]
      ],
      draws: [[draw_type], [atp_draw_s, atp_draw_d], [wta_draw_s, wta_draw_d], [men_draw_s, men_draw_d], [women_draw_s, women_draw_d]],
      tournament: {
        ...tournament,
        id: tournament.id?.toInt()
      },
      year: year.toInt(),
      ...rest
    }
  })

  return {
    count: records[0]?.get("count").toInt() || 0,
    events
  }
})
