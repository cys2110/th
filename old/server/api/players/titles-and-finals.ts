export default defineEventHandler(async query => {
  const { id, selection } = getQuery(query)

  const type = selection === "Titles" ? "Winner" : "Loser"

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH
        (p)-[:ENTERED]->
        (:Entry)-[:SCORED]->
        (:$($type))-[:SCORED]->
        (m:Match)-[:PLAYED]->
        (:Round {round: 'Final'})-[:ROUND_OF]->
        (e:Event)-[:IN_YEAR]->
        (y:Year)
      OPTIONAL MATCH (e)-[:EDITION_OF]->(t:Tournament)
      WITH
        *,
        CASE
          WHEN m:Singles THEN 'Singles'
          ELSE 'Doubles'
        END AS type,
        apoc.coll.min([
          e.start_date,
          e.atp_start_date,
          e.wta_start_date,
          e.men_start_date,
          e.women_start_date
        ]) AS start_date
      ORDER BY start_date
      RETURN
        CASE
          WHEN e IS NULL THEN null
          ELSE
            {
              id: e.id,
              tournament: properties(t),
              type: type,
              category:
                CASE
                  WHEN e.category IS NOT NULL THEN e.category
                  WHEN m:ATP THEN coalesce(e.atp_category, e.men_category, null)
                  ELSE coalesce(e.wta_category, e.women_category, null)
                END,
              year: y.id,
              start_date:
                CASE
                  WHEN e.start_date IS NOT NULL THEN e.start_date
                  WHEN m:ATP THEN coalesce(e.atp_start_date, e.men_start_date, null)
                  ELSE coalesce(e.wta_start_date, e.women_start_date, null)
                END,
              end_date:
                CASE
                  WHEN e.end_date IS NOT NULL THEN e.end_date
                  WHEN m:ATP THEN coalesce(e.atp_end_date, e.men_end_date, null)
                  ELSE coalesce(e.wta_end_date, e.women_end_date, null)
                END
            }
        END AS tournament
    `,
    { id, type }
  )

  const results = records.map(record => {
    const event = record.get("tournament")

    if (ATP_CHALLENGER_CATEGORIES.includes(event?.category) || WTA_CHALLENGER_CATEGORIES.includes(event?.category)) {
      event["level"] = "Challenger"
    } else if (ITF_MEN_CATEGORIES.includes(event?.category) || ITF_WOMEN_CATEGORIES.includes(event?.category)) {
      event["level"] = "ITF"
    } else {
      event["level"] = "Tour"
    }

    return {
      ...event,
      id: event?.id.toInt(),
      tournament: {
        ...event?.tournament,
        id: event?.tournament.id.toInt()
      },
      year: event?.year?.toInt(),
      start_date: {
        year: event?.start_date?.year.toInt(),
        month: event?.start_date?.month.toInt(),
        day: event?.start_date?.day.toInt()
      },
      end_date: {
        year: event?.end_date?.year.toInt(),
        month: event?.end_date?.month.toInt(),
        day: event?.end_date?.day.toInt()
      }
    }
  })

  return results
})
