export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => querySchema.parse(body))

  const { records: countRecords } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (y:Year WHERE SIZE($years) = 0 OR y.id IN $years)<-[:IN_YEAR]-(ed:Edition)-[:EDITION_OF]->(t:Tournament WHERE SIZE($tournaments) = 0 OR t.id IN $tournaments)
      MATCH (e:Event)-[:EVENT_OF]->(ed)
      WHERE
        (SIZE($tours) = 0 OR ANY(tour IN $tours WHERE tour IN labels(e)))
        AND (SIZE($levels) = 0 OR ANY(level IN $levels WHERE level IN labels(e)))
        AND (SIZE($supervisors ) = 0 OR EXISTS {
          MATCH (sup:Supervisor WHERE sup.id IN $supervisors)-[:SUPERVISED]->(e)
        })
        AND (SIZE($categories) = 0 OR e.category IN $categories OR ed.category IN $categories)
        AND (
          (SIZE($surfaces) = 0 AND $environment IS NULL)
          OR EXISTS {
            MATCH (e)-[:ON_SURFACE]->(s:Surface WHERE (SIZE($surfaces) = 0 OR s.surface IN $surfaces) AND ($environment IS NULL OR s.environment = $environment))
          } OR EXISTS {
            MATCH (ed)-[:ON_SURFACE]->(s:Surface WHERE (SIZE($surfaces) = 0 OR s.surface IN $surfaces) AND ($environment IS NULL OR s.environment = $environment))
          }
        )
        AND (
          (SIZE($venues) = 0 AND SIZE($countries) = 0)
          OR (EXISTS {
            MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue WHERE SIZE($venues) = 0 OR v.id IN $venues)-[:LOCATED_IN]->(country:Country WHERE SIZE($countries) = 0 OR country.id IN $countries)
          } OR EXISTS {
            MATCH (ed)-[:TOOK_PLACE_IN]->(v:Venue WHERE SIZE($venues) = 0 OR v.id IN $venues)-[:LOCATED_IN]->(country:Country WHERE SIZE($countries) = 0 OR country.id IN $countries)
          })
        )
        AND (SIZE($umpires) = 0 OR EXISTS {
          MATCH (u:Umpire WHERE u.id IN $umpires)-[:UMPIRED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(e)
        })
        AND ($dateRange IS NULL OR (
          coalesce(e.start_date, ed.start_date) >= $dateRange.start
          and coalesce(e.end_date, ed.end_date) <= $dateRange.end
        ))

        RETURN COUNT(DISTINCT ed) AS count
    `,
    params
  )

  const count = countRecords[0]?.get("count").toInt() || 0

  if (count === 0) {
    return {
      count: 0,
      editions: []
    }
  }

  let query = `/* cypher */
      // Get editions
      MATCH (y:Year WHERE SIZE($years) = 0 OR y.id IN $years)<-[:IN_YEAR]-(ed:Edition)-[:EDITION_OF]->(t:Tournament WHERE SIZE($tournaments) = 0 OR t.id IN $tournaments)
      OPTIONAL MATCH (ed)-[:ON_SURFACE]->(eds:Surface)
      OPTIONAL MATCH (ed)-[:TOOK_PLACE_IN]->(edv:Venue)-[:LOCATED_IN]->(edc:Country)

      // Get events
      MATCH (e:Event)-[:EVENT_OF]->(ed)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(es:Surface)
      OPTIONAL MATCH (sup:Supervisor)-[:SUPERVISED]->(e)
      OPTIONAL MATCH (u:Umpire)-[:UMPIRED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(e)
      OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(ev:Venue)-[:LOCATED_IN]->(ec:Country)

      WHERE
        (SIZE($tours) = 0 OR ANY(tour IN $tours WHERE tour IN labels(e)))
        AND (SIZE($levels) = 0 OR ANY(level IN $levels WHERE level IN labels(e)))
        AND (SIZE($categories) = 0 OR e.category IN $categories OR ed.category IN $categories)

      WITH
        e,
        y,
        t,
        ed,
        es,
        eds,
        COLLECT(DISTINCT properties(sup)) AS supervisors,
        COLLECT(DISTINCT sup.id) AS supervisor_ids,
        COLLECT(DISTINCT properties(u)) AS umpires,
        COLLECT(DISTINCT u.id) AS umpire_ids,
        CASE WHEN COUNT(edv) = 0 THEN [] ELSE COLLECT(DISTINCT apoc.map.merge(properties(edv), {country: properties(edc)})) END AS ed_venues,
        CASE WHEN COUNT(ev) = 0 THEN [] ELSE COLLECT(DISTINCT apoc.map.merge(properties(ev), {country: properties(ec)})) END AS e_venues,
        COLLECT(DISTINCT edv.id) AS ed_venue_ids,
        COLLECT(DISTINCT ev.id) AS e_venue_ids,
        COLLECT(DISTINCT edc.id) AS ed_country_ids,
        COLLECT(DISTINCT ec.id) AS e_country_ids

      WHERE
        ((SIZE($surfaces) = 0 AND $environment IS NULL) OR ((SIZE($surfaces) = 0 OR es.surface IN $surfaces OR eds.surface IN $surfaces) AND ($environment IS NULL OR es.environment = $environment OR eds.environment = $environment)) )
        AND (SIZE($supervisors) = 0 OR ANY(id IN $supervisors WHERE id IN supervisor_ids) )
        AND (SIZE($umpires) = 0 OR ANY(id IN $umpires WHERE id IN umpire_ids) )
        AND ((SIZE ($venues) = 0 AND SIZE($countries) = 0) OR ((SIZE($venues) = 0 OR (ANY(id IN $venues WHERE id IN e_venue_ids) OR ANY(id IN $venues WHERE id IN ed_venue_ids))) AND (SIZE($countries) = 0 OR (ANY(id IN $countries WHERE id IN e_country_ids) OR ANY(id IN $countries WHERE id IN ed_country_ids)))))

      WITH
        y,
        t,
        ed,
        eds,
        ed_venues,
        MIN(coalesce(e.start_date, ed.start_date)) AS start_date,
        COLLECT(
          apoc.map.clean(
            apoc.map.merge(
              properties(e),
              {
                surface: properties(es),
                venues: e_venues,
                supervisors: supervisors,
                umpires: umpires,
                tour: [x IN labels(e) WHERE x IN ['ATP', 'WTA', 'Men', 'Women']][0],
                level: [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0]
              }
            ), [], [null]
          )
        ) AS events

      WHERE $dateRange IS NULL OR (
          start_date >= $dateRange.start AND
          start_date <= $dateRange.end
        )

      ORDER BY
    `

  if (params.sortField[0].direction === "ASC") {
    query += `
        start_date ASC
      `
  } else {
    query += `
        start_date DESC
      `
  }

  query += `/* cypher */
      RETURN DISTINCT apoc.map.clean(
        apoc.map.merge(
          properties(ed),
          {
            surface: properties(eds),
            venues: ed_venues,
            tournament: properties(t),
            year: y.id,
            events: events
          }
        ), [], [null]
      ) AS edition
      SKIP $skip
      LIMIT $offset
    `

  const { records } = await useDriver().executeQuery(query, params)

  // Convert Neo4j types to standard JavaScript types
  const editions = records.map(record => {
    const edition: any = record.get("edition")

    return resultsArchiveSchema.parse(edition)
  })

  return {
    count: count as number,
    editions
  }
})
