export default defineEventHandler(async query => {
  const { id } = getQuery<{ id: string }>(query)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH (p)-[v1:REPRESENTS]->(c:Country)
      OPTIONAL MATCH (p)-[:TURNED_PRO]->(tp:Year)
      OPTIONAL MATCH (p)-[:RETIRED]->(ret:Year)
      OPTIONAL MATCH (p)-[v2:REPRESENTED]->(c1:Country)
      OPTIONAL MATCH (x:Coach)-[t:COACHES]->(p)
      OPTIONAL MATCH (x1:Coach)-[t1:COACHED]->(p)
      OPTIONAL MATCH (p)-[:HOF]->(hof:Year)
      OPTIONAL MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year)
      WITH p, c, tp, ret, hof,
      COLLECT(DISTINCT y.id) AS years,
      COLLECT
        (DISTINCT apoc.map.clean(
          apoc.map.merge(
              properties(c1), {start_date: v2.start_date, end_date: v2.end_date}
            ), [], [null]
        )
      ) AS previous_countries,
      apoc.map.clean(
        apoc.map.merge(
          properties(c), {start_date: v1.start_date}
        ), [], [null]
      ) AS country,
      COLLECT(
        DISTINCT apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(
              x, ['id', 'first_name', 'last_name'], null, false
            ), {start_date: t.start_date, end_date: t.end_date}
          ), [], [null]
        )
       ) AS coaches,
      COLLECT(
        DISTINCT apoc.map.clean(
          apoc.map.merge(
            apoc.map.submap(
              x1, ['id', 'first_name', 'last_name'], null, false
            ), {start_date: t1.start_date, end_date: t1.end_date}
          ), [], [null]
        )
      ) AS former_coaches
      RETURN [x IN labels(p) WHERE NOT x IN ['Player', 'Coach', 'Update']][0] AS tour, country, properties(p) AS player, tp.id AS turned_pro, ret.id AS retired, previous_countries, coaches, former_coaches, hof.id AS hof, years AS years
    `,
    { id }
  )

  console.log(
    `Notifications for player: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  const result = records[0].toObject()

  if (result.coaches.length === 1 && !result.coaches[0].id) {
    result.coaches = []
  } else {
    for (const coach of result.coaches) {
      if (coach.start_date) coach.start_date = coach.start_date.toStandardDate().toISOString().slice(0, 10)
      if (coach.end_date) coach.end_date = coach.end_date.toStandardDate().toISOString().slice(0, 10)
    }
  }

  if (result.former_coaches.length === 1 && !result.former_coaches[0].id) {
    result.former_coaches = []
  } else {
    for (const coach of result.former_coaches) {
      if (coach.start_date) coach.start_date = coach.start_date.toStandardDate().toISOString().slice(0, 10)
      if (coach.end_date) coach.end_date = coach.end_date.toStandardDate().toISOString().slice(0, 10)
    }
  }

  if (result.previous_countries.length === 1 && !result.previous_countries[0].id) {
    result.previous_countries = []
  } else {
    for (const country of result.previous_countries) {
      if (country.start_date) country.start_date = country.start_date.toStandardDate().toISOString().slice(0, 10)
      if (country.end_date) country.end_date = country.end_date.toStandardDate().toISOString().slice(0, 10)
    }
  }

  if (result.country?.start_date) result.country.start_date = result.country.start_date.toStandardDate().toISOString().slice(0, 10)

  return {
    tour: result.tour,
    country: result.country,
    former_countries: result.previous_countries,
    turned_pro: result.turned_pro?.toInt() || undefined,
    retired: result.retired?.toInt() || undefined,
    coaches: result.coaches,
    former_coaches: result.former_coaches,
    id: result.player.id,
    first_name: result.player.first_name,
    last_name: result.player.last_name,
    site_link: result.player.site_link,
    wiki_link: result.player.wiki_link,
    bh: result.player.bh,
    rh: result.player.rh,
    current_singles: result.player.current_singles?.toInt(),
    current_doubles: result.player.current_doubles?.toInt(),
    ch_singles: result.player.ch_singles?.toInt(),
    ch_doubles: result.player.ch_doubles?.toInt(),
    singles_ch_date: result.player.singles_ch_date?.toStandardDate().toISOString().slice(0, 10),
    doubles_ch_date: result.player.doubles_ch_date?.toStandardDate().toISOString().slice(0, 10),
    dob: result.player.dob?.toStandardDate().toISOString().slice(0, 10),
    dod: result.player.dod?.toStandardDate().toISOString().slice(0, 10),
    height: result.player.height?.toInt(),
    official_link: result.player.official_link,
    pm: result.player.pm?.toNumber(),
    hof: result.hof?.toInt() || undefined,
    updated_at: result.player.updated_at?.toStandardDate().toISOString().slice(0, 10),
    years: result.years.map((y: any) => y.toInt()).sort((a: number, b: number) => a - b)
  }
})
