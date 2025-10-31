export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH
      (t:Tournament WHERE t.name IS NOT NULL)<-[:EDITION_OF]-
      (e:Event
        WHERE
        coalesce(
          e.start_date,
          e.atp_start_date,
          e.wta_start_date,
          e.men_start_date,
          e.women_start_date
        ) IS
        NOT
        NULL)-
        [:TOOK_PLACE_IN]->
      (v:Venue)-[:LOCATED_IN]->
      (:Country {id: $id})
    MATCH (e)-[:IN_YEAR]->(y:Year)
    WITH
      *,
      apoc.coll.min([
        e.start_date,
        e.atp_start_date,
        e.wta_start_date,
        e.men_start_date,
        e.women_start_date
      ]) AS start_date
    ORDER BY start_date
    WITH
      COLLECT(properties(v)) AS venues,
      e,
      y,
      t,
      [x IN labels(e) WHERE NOT x IN ['Update', 'Event']] AS tours
    RETURN
      CASE
        WHEN
          e IS NOT NULL
          THEN
            {
              tours: tours,
              id: e.id,
              year: y.id,
              tournament: properties(t),
              venues: venues
            }
        ELSE null
      END AS event
    `,
    { id }
  )

  const results = records.map(record => record.get("event")).filter(Boolean)

  const events = results.map(event => ({
    ...event,
    id: event.id.toInt(),
    year: event.year.toInt(),
    tournament: {
      ...event.tournament,
      id: event.tournament.id.toInt()
    }
  }))

  return events
})
