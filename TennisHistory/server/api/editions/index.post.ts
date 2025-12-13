export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => querySchema.parse(body))

  const { records: countRecords } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (:Tournament {id: $id})<-[:EDITION_OF]-(e:Edition)
        WHERE
          (SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(e)))
          AND (SIZE($years) = 0 OR EXISTS {
            MATCH (e)-[:IN_YEAR]->(y:Year WHERE y.id IN $years)
          })
          AND SIZE($players) = 0 OR EXISTS {
            MATCH (e)<-[:EVENT_OF]-(:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player WHERE p.id IN $players)
          }
      RETURN COUNT(e) AS count
    `,
    params
  )

  const count: number = countRecords[0]?.get("count").toInt() || 0

  if (count === 0) {
    return {
      count: 0,
      editions: []
    }
  }

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    MATCH (:Tournament {id: $id})<-[:EDITION_OF]-(e:Edition)
    WHERE SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(e))
    MATCH (e)-[:IN_YEAR]->(y:Year WHERE SIZE($years) = 0 OR y.id IN $years)

    WITH e, y
    ORDER BY y.id DESC
    SKIP $skip
    LIMIT $offset

    OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
    OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)

    WITH
      e,
      y,
      s,
      CASE
        WHEN COUNT(v) = 0 THEN []
        ELSE COLLECT(DISTINCT apoc.map.merge(
          properties(v),
          {country: properties(c)})
        )
      END AS venues
    CALL (e) {
      OPTIONAL MATCH (e)<-[:EVENT_OF]-(event:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(country:Country)

      CALL (p, country, e, event) {
        OPTIONAL MATCH (p)-[cdate:REPRESENTED WHERE cdate.start_date <= coalesce(event.start_date, e.start_date) AND cdate.end_date > coalesce(event.start_date, e.start_date)]->(country1:Country)
        RETURN coalesce(properties(country1), properties(country)) AS playerCountry
      }

      CALL (p) {
        RETURN COLLECT(DISTINCT p.id) AS winner_ids
      }

      WITH
        CASE
          WHEN f:Singles THEN 'Singles'
          WHEN f:Doubles THEN 'Doubles'
          ELSE NULL
        END AS type,
        COLLECT(DISTINCT apoc.map.merge(
          apoc.map.submap(
            p,
            ['id', 'first_name', 'last_name'],
            null,
            false
          ),
          { country: playerCountry}
        )) AS team,
        [x IN labels(event) WHERE x <> 'Event'][0] AS tour
      WHERE type IS NOT NULL
      ORDER BY tour, type DESC
      RETURN COLLECT(DISTINCT{team: team, type: type, tour: tour}) AS winners
    }
    WITH
      e,
      y,
      s,
      venues,
      winners,
      [x IN labels(e) WHERE x <> 'Edition'] AS tours,
      apoc.coll.flatten([x IN winners | [j IN x.team | j.id]]) AS winner_ids
    WHERE SIZE($players) = 0 OR ANY(id IN winner_ids WHERE id IN $players)

    RETURN apoc.map.clean(
      {
        id: e.id,
        sponsor_name: e.sponsor_name,
        category: e.category,
        start_date: e.start_date,
        end_date: e.end_date,
        currency: e.currency,
        tfc: e.tfc,
        tours: tours,
        year: y.id,
        surface: properties(s),
        venues: venues,
        winners: winners
      },
      [],
      [null]
    ) AS edition
    `,
    params
  )

  const results = records.map(record => {
    const edition = record.get("edition")

    return baseEditionSchema.parse(edition)
  })

  return {
    count,
    editions: results
  }
})
