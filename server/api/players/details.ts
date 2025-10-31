export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH (p)-[:TURNED_PRO]->(t:Year)
      OPTIONAL MATCH (p)-[:RETIRED]->(r:Year)
      OPTIONAL MATCH (p)-[:HOF]->(hof:Year)
      CALL (p) {
        OPTIONAL MATCH (p)-[z:REPRESENTED]->(fc:Country)
        WITH
          CASE
            WHEN fc IS NULL THEN null
            ELSE apoc.map.merge(properties(fc), properties(z))
          END AS country
        RETURN COLLECT(DISTINCT country) AS countries
      }
      CALL (p) {
        OPTIONAL MATCH (p)<-[x:COACHES]-(z:Coach)
        WITH
          CASE
            WHEN z IS NULL THEN null
            ELSE
              apoc.map.mergeList([
                apoc.map.submap(z, ['id', 'first_name', 'last_name'], null, false),
                properties(x),
                {labels: labels(z)}
              ])
          END AS coach
        RETURN COLLECT(DISTINCT coach) AS coaches
      }
      CALL (p) {
        OPTIONAL MATCH (p)<-[x:COACHED]-(z:Coach)
        WITH
          CASE
            WHEN z IS NULL THEN null
            ELSE
              apoc.map.mergeList([
                apoc.map.submap(z, ['id', 'first_name', 'last_name'], null, false),
                properties(x),
                {labels: labels(z)}
              ])
          END AS coach
        RETURN COLLECT(DISTINCT coach) AS coached
      }
      RETURN
        apoc.map.clean(
          apoc.map.merge(
            properties(p),
            {
              coaches: coaches,
              former_coaches: coached,
              former_countries: countries,
              turned_pro: t.id,
              retired: r.id,
              hof: hof.id,
              age:
                CASE
                  WHEN
                    p.dod IS NOT NULL AND p.dob IS NOT NULL
                    THEN duration.between(p.dob, p.dod).years
                  WHEN p.dob IS NOT NULL THEN duration.between(p.dob, date()).years
                  ELSE null
                END
            }
          ),
          [],
          [null, {}]
        ) AS player
    `,
    { id }
  )

  const { records: wlRecords } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (p:Player {id: $id})
    OPTIONAL MATCH
      (p)-[:ENTERED]->
      (:Entry)-[:SCORED]->
      (s:Score)-[:SCORED]->
      (m:Match)-[:PLAYED]->
      (r:Round)-[:ROUND_OF]->
      (e:Event)-[:EVENT_OF]->(ed:Edition)
    WITH
      CASE WHEN s:Singles THEN 'Singles' ELSE 'Doubles' END AS type,
      [x IN labels(e) WHERE x IN ['Tour', 'Challenger', 'ITF']][0] AS level,
      CASE WHEN s:Main THEN 'Main' ELSE 'Qualifying' END AS draw,
      CASE WHEN s:Winner THEN true ELSE false END AS won,
      CASE WHEN r.round = 'Final' AND s:Winner THEN true ELSE false END AS title
    RETURN {
      type: type,
      level: level,
      draw: draw,
      won: won,
      title: title
    } AS score
    `,
    { id }
  )

  const { records: h2hRecords } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (p:Player {id: $id})-[:ENTERED]->(:Entry)-[:SCORED]->(s:Score)-[:SCORED]->(m:Singles)<-[:SCORED]-(:Score)<-[:SCORED]-(:Entry)<-[:ENTERED]-(opponent:Player) WHERE p.id <> opponent.id
      OPTIONAL MATCH (opponent)-[:REPRESENTS]->(c:Country)
      WITH apoc.map.merge(apoc.map.submap(opponent, ['id', 'first_name', 'last_name'], null, false), {country: apoc.any.properties(c)}) AS opponent, count(m) AS matches, SUM(CASE WHEN s:Winner THEN 1 ELSE 0 END) AS wins
      ORDER BY matches DESC
      LIMIT 10
      RETURN opponent, matches, wins
          `,
    { id }
  )

  const numberKeys = [
    "age",
    "current_doubles",
    "no1_weeks",
    "ch_singles",
    "ye_no1",
    "no1_consecutive",
    "ch_doubles",
    "current_singles",
    "pm",
    "height",
    "hof",
    "matches",
    "wins",
    "turned_pro",
    "retired"
  ]

  const dateKeys = ["singles_ch_date", "dob", "doubles_ch_date", "dod", "start_date", "end_date"]

  const player = records[0].get("player")
  for (const key of numberKeys) {
    if (player[key]) player[key] = player[key].toInt()
  }
  for (const key of dateKeys) {
    if (player[key]) player[key] = player[key].toStandardDate().toISOString().slice(0, 10)
    if (player["countries"]) {
      player["countries"] = player["countries"].map((country: any) => {
        if (country[key]) {
          country[key] = country[key].toStandardDate().toISOString().slice(0, 10)
        }
        return country
      })
    }
  }

  player["coaches"] = [
    ...player["coaches"],
    ...player["former_coaches"].map((coach: any) => {
      if (!coach.years) coach.years = "Former"
      return coach
    })
  ]
  delete player["former_coaches"]

  const wlResults = wlRecords.map(record => record.get("score"))

  // Get all score aggregates
  const total = {
    label: "Total",
    total: {
      singles: {
        wl: `${wlResults.filter(record => record.type === "Singles" && record.won).length}-${
          wlResults.filter(record => record.type === "Singles" && !record.won).length
        }`,
        titles: wlResults.filter(record => record.title && record.type === "Singles").length
      },
      doubles: {
        wl: `${wlResults.filter(record => record.type === "Doubles" && record.won).length}-${
          wlResults.filter(record => record.type === "Doubles" && !record.won).length
        }`,
        titles: wlResults.filter(record => record.title && record.type === "Doubles").length
      }
    },
    main: {
      singles: {
        wl: `${wlResults.filter(record => record.type === "Singles" && record.draw === "Main" && record.won).length}-${
          wlResults.filter(record => record.type === "Singles" && record.draw === "Main" && !record.won).length
        }`,
        titles: wlResults.filter(record => record.title && record.type === "Singles" && record.draw === "Main").length
      },
      doubles: {
        wl: `${wlResults.filter(record => record.type === "Doubles" && record.draw === "Main" && record.won).length}-${
          wlResults.filter(record => record.type === "Doubles" && record.draw === "Main" && !record.won).length
        }`,
        titles: wlResults.filter(record => record.title && record.type === "Doubles" && record.draw === "Main").length
      }
    },
    qualifying: {
      singles: `${wlResults.filter(record => record.type === "Singles" && record.draw === "Qualifying" && record.won).length}-${
        wlResults.filter(record => record.type === "Singles" && record.draw === "Qualifying" && !record.won).length
      }`,
      doubles: `${wlResults.filter(record => record.type === "Doubles" && record.draw === "Qualifying" && record.won).length}-${
        wlResults.filter(record => record.type === "Doubles" && record.draw === "Qualifying" && !record.won).length
      }`
    }
  }

  const wl = [total]

  const levels = ["Tour", "Challenger", "ITF"]

  for (const level of levels) {
    const tourResults = wlResults.filter(record => record.level === level)

    wl.push({
      label: level,
      total: {
        singles: {
          wl: `${tourResults.filter(record => record.type === "Singles" && record.won).length}-${
            tourResults.filter(record => record.type === "Singles" && !record.won).length
          }`,
          titles: tourResults.filter(record => record.title && record.type === "Singles").length
        },
        doubles: {
          wl: `${tourResults.filter(record => record.type === "Doubles" && record.won).length}-${
            tourResults.filter(record => record.type === "Doubles" && !record.won).length
          }`,
          titles: tourResults.filter(record => record.title && record.type === "Doubles").length
        }
      },
      main: {
        singles: {
          wl: `${tourResults.filter(record => record.type === "Singles" && record.draw === "Main" && record.won).length}-${
            tourResults.filter(record => record.type === "Singles" && record.draw === "Main" && !record.won).length
          }`,
          titles: tourResults.filter(record => record.title && record.type === "Singles" && record.draw === "Main").length
        },
        doubles: {
          wl: `${tourResults.filter(record => record.type === "Doubles" && record.draw === "Main" && record.won).length}-${
            tourResults.filter(record => record.type === "Doubles" && record.draw === "Main" && !record.won).length
          }`,
          titles: tourResults.filter(record => record.title && record.type === "Doubles" && record.draw === "Main").length
        }
      },
      qualifying: {
        singles: `${tourResults.filter(record => record.type === "Singles" && record.draw === "Qualifying" && record.won).length}-${
          tourResults.filter(record => record.type === "Singles" && record.draw === "Qualifying" && !record.won).length
        }`,
        doubles: `${tourResults.filter(record => record.type === "Doubles" && record.draw === "Qualifying" && record.won).length}-${
          tourResults.filter(record => record.type === "Doubles" && record.draw === "Qualifying" && !record.won).length
        }`
      }
    })
  }

  const h2hResults = h2hRecords.map(record => record.toObject())
  for (const record of h2hResults) {
    for (const key of numberKeys) {
      if (record[key]) record[key] = record[key].toInt()
    }
  }

  return {
    ...player,
    wl,
    h2h: h2hResults
  }
})
