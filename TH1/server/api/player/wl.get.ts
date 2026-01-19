import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const query = `/* cypher */
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
    `

    const { records } = await useDriver().executeQuery(query, params)

    const wlResults = records.map(record => record.get("score"))

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

    return wlSchema.array().parse(wl)
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation errors",
        data: { validationErrors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
      })
    }

    console.error(error)
    throw error
  }
})
