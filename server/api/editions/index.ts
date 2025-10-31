import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    skip: string
    filters: any
  }

  const { id, skip, filters } = getQuery<QueryProps>(event)
  const { winners, years, tours } = JSON.parse(filters)

  const formattedParams = {
    id: int(id),
    skip: int(skip),
    tours,
    years: years.map((y: string) => int(y)),
    winners: Array.isArray(winners) ? winners : [winners]
  }

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    CYPHER 25
    CALL () {
      MATCH (:Tournament {id: $id})<-[:EDITION_OF]-(e:Edition)
      WHERE
        (SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(e)))
        AND (SIZE($years) = 0 OR EXISTS {
          MATCH (e)-[:IN_YEAR]->(y:Year WHERE y.id IN $years)
        })
        AND SIZE($winners) = 0 OR EXISTS {
          MATCH (e)<-[:EVENT_OF]-(:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player WHERE p.id IN $winners)
        }
      RETURN COUNT(e) AS count
    }
    CALL () {
      MATCH (:Tournament {id: $id})<-[:EDITION_OF]-(e:Edition)
      WHERE SIZE($tours) = 0 OR ANY(x IN $tours WHERE x IN labels(e))
      MATCH (e)-[:IN_YEAR]->(y:Year WHERE SIZE($years) = 0 OR y.id IN $years)
      WITH e, y
      ORDER BY y.id DESC
      SKIP $skip
      LIMIT 40
      OPTIONAL MATCH (e)-[:TOOK_PLACE_IN]->(v:Venue)-[:LOCATED_IN]->(c:Country)
      OPTIONAL MATCH (e)-[:ON_SURFACE]->(s:Surface)
      WITH e, y, s, CASE WHEN COUNT(v) = 0 THEN [] ELSE COLLECT(DISTINCT apoc.map.merge(properties(v), {country: properties(c)})) END AS venues
      CALL (e) {
        OPTIONAL MATCH (e)<-[:EVENT_OF]-(event:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(f:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(country:Country)
        CALL (p, country, e, event) {
          OPTIONAL MATCH (p)-[cdate:REPRESENTED WHERE cdate.start_date <= coalesce(event.start_date, e.start_date) AND cdate.end_date > coalesce(event.start_date, e.start_date)]->(country1:Country)
          CALL (*) {
            WHEN country1 IS NOT NULL THEN RETURN properties(country1) AS playerCountry
            ELSE RETURN properties(country) AS playerCountry
          }
          RETURN playerCountry
        }
        CALL (p) {
          RETURN COLLECT(DISTINCT p.id) AS winner_ids
        }
        WITH CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END AS type, COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), { country: playerCountry})) AS team, [x IN labels(event) WHERE x <> 'Event'][0] AS tour
        ORDER BY tour, type DESC
        RETURN COLLECT(DISTINCT{team: team, type: type, tour: tour}) AS winners
      }
      WITH e, y, s, venues, winners, [x IN labels(e) WHERE x <> 'Edition'] AS tours, apoc.coll.flatten([x IN winners | [j IN x.team | j.id]]) AS winner_ids
      WHERE SIZE($winners) = 0 OR ANY(id IN winner_ids WHERE id IN $winners)
      RETURN apoc.map.clean(apoc.map.merge(properties(e), { tours: tours, year: y.id, surface: properties(s), venues: venues, winners: winners }), [], [null]) AS edition
    }
    RETURN edition, count
    `,
    formattedParams
  )

  console.log(
    `Notifications for editions: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (!records?.[0]?.get("edition") || Object.keys(records[0]?.get("edition")).length === 0) {
    return {
      count: 0,
      editions: []
    }
  }

  const results = records.map(record => {
    const edition = record.get("edition")
    const numberKeys = ["id", "year", "tfc"]
    for (const key of numberKeys) {
      if (edition[key]) edition[key] = edition[key].toInt()
    }

    const dateKeys = ["start_date", "end_date", "updated_at"]
    for (const key of dateKeys) {
      if (edition[key]) edition[key] = edition[key].toStandardDate().toISOString().slice(0, 10)
    }

    return edition
  })

  return {
    count: records[0].get("count").toInt(),
    editions: results
  }
})
