export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
    MATCH (p:Player {id: $id})
    OPTIONAL MATCH (p)-[v1:REPRESENTS]->(c:Country)
    OPTIONAL MATCH (p)-[v2:REPRESENTED]->(c2:Country)
    OPTIONAL MATCH (p)-[:TURNED_PRO]->(tp:Year)
    OPTIONAL MATCH (p)-[:RETIRED]->(ret:Year)
    OPTIONAL MATCH (p)-[:HOF]->(hof:Year)
    OPTIONAL MATCH (x1:Coach)-[t1:COACHES]->(p)
    OPTIONAL MATCH (x2:Coach)-[t2:COACHED]->(p)

    WITH p, tp, ret, hof, CASE WHEN COUNT(c2) = 0 THEN [] ELSE COLLECT(
      apoc.map.clean(
        apoc.map.merge(
          properties(c2),
          {start_date: v2.start_date, end_date: v2.end_date}
        ),
        [],
        [null]
      )
    ) END AS former_countries,
    CASE WHEN c IS NULL THEN null ELSE apoc.map.clean(
      apoc.map.merge(
        properties(c),
        {start_date: v1.start_date}
      ),
      [],
      [null]
    ) END AS country,
    CASE WHEN COUNT(x1) = 0 THEN [] ELSE COLLECT(DISTINCT
      apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(
            x1,
            ['id', 'first_name', 'last_name'],
            null,
            false
          ),
          {
            labels: [x IN labels(x1) WHERE x in ['Player']],
            years: t1.years
          }
        ),
        [],
        [null]
      )
    ) END AS coaches,
    CASE WHEN COUNT(x2) = 0 THEN [] ELSE COLLECT(DISTINCT
      apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(
            x2,
            ['id', 'first_name', 'last_name'],
            null,
            false
          ),
          {
            labels: [x IN labels(x2) WHERE x in ['Player']],
            years: t2.years
          }
        ),
        [],
        [null]
      )
    ) END AS former_coaches,
    [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0] AS tour
    RETURN apoc.map.clean(
      apoc.map.merge(
        properties(p),
        {
          tour: tour,
          country: country,
          former_countries: former_countries,
          coaches: coaches,
          former_coaches: former_coaches,
          turned_pro: tp.id,
          retired: ret.id,
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
      [], [null]
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
      (e:Event)-[:EVENT_OF]->
      (ed:Edition)
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
      WITH apoc.map.clean(apoc.map.merge(apoc.map.submap(opponent, ['id', 'first_name', 'last_name'], null, false), {country: properties(c)}), [], [null]) AS opponent, count(m) AS matches, SUM(CASE WHEN s:Winner THEN 1 ELSE 0 END) AS wins
      WHERE matches > 0
      ORDER BY matches DESC, wins DESC
      LIMIT 10
      RETURN opponent, matches, wins
          `,
    { id }
  )

  const player = records[0].get("player")
  const wlResults = wlRecords.map(record => record.get("score"))

  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: "Player not found"
    })
  }

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

  return {
    ...playerDetailsSchema.parse(player),
    wl: wlSchema.array().parse(wl),
    h2h: playerH2HSchema.array().parse(h2hResults)
  }
})
