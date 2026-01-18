import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => playerStatsQuerySchema.parse(body))

    const { records } = await useDriver().executeQuery(
      `/* cypher */
        OPTIONAL MATCH
          (:Player {id: $id})-[:ENTERED]->
          (:Entry:Singles)-[:SCORED]->
          (s:Score)-[:SCORED]->
          (m:Match)-[:PLAYED]->
          (:Round)-[:ROUND_OF]->
          (e:Event)-[:EVENT_OF]->
          (ed:Edition)-[:IN_YEAR]->
          (y:Year WHERE SIZE($years) = 0 OR y.id IN $years)
        OPTIONAL MATCH (e)-[:ON_SURFACE]->(z:Surface)
        OPTIONAL MATCH (ed)-[:ON_SURFACE]->(edz:Surface)

        WITH
          s,
          m,
          e,
          coalesce(z, edz) AS surface
        WHERE
          (SIZE($levels) = 0 OR ANY(x IN $levels WHERE x IN labels(e))) AND
          ($drawType IS NULL OR $drawType in labels(m)) AND
          (SIZE($surfaces) = 0 OR surface.surface IN $surfaces)

        RETURN apoc.map.removeKeys(
          s,
          [
            's1',
            's2',
            's3',
            's4',
            's5',
            't1',
            't2',
            't3',
            't4',
            't5',
            'incomplete'
          ]
        ) AS score
      `,
      params
    )

    const results = records.map((record: any) => {
      const score = record.get("score")

      return scoreFormSchema.parse(score)
    })

    const stats = [
      {
        stat: "Aces",
        percent: false,
        value: results.reduce((acc, r) => acc + (r.aces ?? 0), 0)
      },
      {
        stat: "Double Faults",
        percent: false,
        value: results.reduce((acc, r) => acc + (r.dfs ?? 0), 0)
      },
      {
        stat: "First Serve %",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.serve1 ?? 0), 0),
          results.reduce((acc, r) => acc + (r.serve1 ?? 0) + (r.serve2 ?? 0), 0)
        )
      },
      {
        stat: "First Serve Points Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.serve1_w ?? 0), 0),
          results.reduce((acc, r) => acc + (r.serve1 ?? 0), 0)
        )
      },
      {
        stat: "Second Serve Points Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.serve2_w ?? 0), 0),
          results.reduce((acc, r) => acc + (r.serve2 ?? 0), 0)
        )
      },
      {
        stat: "Break Points Faced",
        percent: false,
        value: results.reduce((acc, r) => acc + (r.bps_faced ?? 0), 0)
      },
      {
        stat: "Break Points Saved",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.bps_saved ?? 0), 0),
          results.reduce((acc, r) => acc + (r.bps_faced ?? 0), 0)
        )
      },
      {
        stat: "Service Games Played",
        percent: false,
        value: results.reduce((acc, r) => acc + (r.serve_games ?? 0), 0)
      },
      {
        stat: "Service Games Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => {
            const breakPointsLost = (r.bps_faced ?? 0) - (r.bps_saved ?? 0)
            const serveGamesWon = (r.serve_games ?? 0) - breakPointsLost
            return acc + serveGamesWon
          }, 0),
          results.reduce((acc, r) => acc + (r.serve_games ?? 0), 0)
        )
      },
      {
        stat: "Total Service Points Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.serve1_w ?? 0) + (r.serve2_w ?? 0), 0),
          results.reduce((acc, r) => acc + (r.serve1 ?? 0) + (r.serve2 ?? 0), 0)
        )
      },
      {
        stat: "First Serve Return Points Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.ret1_w ?? 0), 0),
          results.reduce((acc, r) => acc + (r.ret1 ?? 0), 0)
        )
      },
      {
        stat: "Second Serve Return Points Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.ret2_w ?? 0), 0),
          results.reduce((acc, r) => acc + (r.ret2 ?? 0), 0)
        )
      },
      {
        stat: "Break Points Opportunities",
        percent: false,
        value: results.reduce((acc, r) => acc + (r.bp_opps ?? 0), 0)
      },
      {
        stat: "Break Points Converted",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.bps_converted ?? 0), 0),
          results.reduce((acc, r) => acc + (r.bp_opps ?? 0), 0)
        )
      },
      {
        stat: "Return Games Played",
        percent: false,
        value: results.reduce((acc, r) => acc + (r.return_games ?? 0), 0)
      },
      {
        stat: "Return Games Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.bps_converted ?? 0), 0),
          results.reduce((acc, r) => acc + (r.return_games ?? 0), 0)
        )
      },
      {
        stat: "Return Points Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.ret1_w ?? 0) + (r.ret2_w ?? 0), 0),
          results.reduce((acc, r) => acc + (r.ret1 ?? 0) + (r.ret2 ?? 0), 0)
        )
      },
      {
        stat: "Total Points Won",
        percent: true,
        value: percentage(
          results.reduce((acc, r) => acc + (r.serve1_w ?? 0) + (r.serve2_w ?? 0) + (r.ret1_w ?? 0) + (r.ret2_w ?? 0), 0),
          results.reduce((acc, r) => acc + (r.serve1 ?? 0) + (r.serve2 ?? 0) + (r.ret1 ?? 0) + (r.ret2 ?? 0), 0)
        )
      }
    ]

    return stats
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
