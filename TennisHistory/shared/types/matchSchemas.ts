import { array, boolean, literal, object, string, z } from "zod"
import { intToNumberSchema, neoDateToStringSchema, personSchema, surfaceSchema } from "./schemas"
import { Duration, Integer } from "neo4j-driver"
import { entrySchema, eventSchema } from "./eventSchemas"
import { editionSchema } from "./editionSchemas"
import { DrawEnum, IncompleteEnum, RoundEnum } from "./enums"

export const scoreFormSchema = object({
  id: string(),
  s1: intToNumberSchema.nullish(),
  s2: intToNumberSchema.nullish(),
  s3: intToNumberSchema.nullish(),
  s4: intToNumberSchema.nullish(),
  s5: intToNumberSchema.nullish(),
  t1: intToNumberSchema.nullish(),
  t2: intToNumberSchema.nullish(),
  t3: intToNumberSchema.nullish(),
  t4: intToNumberSchema.nullish(),
  t5: intToNumberSchema.nullish(),
  incomplete: IncompleteEnum.nullish(),
  aces: intToNumberSchema.optional(),
  dfs: intToNumberSchema.optional(),
  serve1_w: intToNumberSchema.optional(),
  serve1: intToNumberSchema.optional(),
  serve2_w: intToNumberSchema.optional(),
  serve2: intToNumberSchema.optional(),
  ret1_w: intToNumberSchema.optional(),
  ret1: intToNumberSchema.optional(),
  ret2_w: intToNumberSchema.optional(),
  ret2: intToNumberSchema.optional(),
  bps_saved: intToNumberSchema.optional(),
  bps_faced: intToNumberSchema.optional(),
  bps_converted: intToNumberSchema.optional(),
  bp_opps: intToNumberSchema.optional(),
  net_w: intToNumberSchema.optional(),
  net: intToNumberSchema.optional(),
  winners: intToNumberSchema.optional(),
  ues: intToNumberSchema.optional(),
  max_speed: intToNumberSchema.optional(),
  avg1_speed: intToNumberSchema.optional(),
  avg2_speed: intToNumberSchema.optional(),
  serve_games: intToNumberSchema.optional(),
  return_games: intToNumberSchema.optional()
})

export const matchSchema = object({
  date: neoDateToStringSchema.optional(),
  draw: DrawEnum,
  id: string(),
  incomplete: IncompleteEnum.optional(),
  match_no: intToNumberSchema,
  round: RoundEnum,
  sets: array(array(array(intToNumberSchema.nullable()))).optional(),
  stats: boolean(),
  winning_team: literal(["t1", "t2"]).optional()
})

// export const matchSchema = object({
//   id: string(),
//   noOfSets: intToNumberSchema.optional(),
//   match_no: intToNumberSchema,
//   duration: z
//     .instanceof(Duration)
//     .transform(val => (val.seconds as Integer).toInt())
//     .optional(),
//   date: neoDateToStringSchema.optional(),
//   court: string().optional(),
//   draw: DrawEnum,
//   type: MatchTypeEnum,
//   round: RoundEnum,
//   round_no: intToNumberSchema,
//   umpire: personSchema
//     .omit({
//       country: true
//     })
//     .optional(),
//   stats: boolean(),
//   incomplete: IncompleteEnum.optional(),
//   sets: array(array(array(intToNumberSchema.nullable()))).optional(),
//   winner: entrySchema
//     .omit({
//       draws: true
//     })
//     .extend({
//       team: array(
//         personSchema.extend({
//           rank: intToNumberSchema.optional()
//         })
//       )
//     })
//     .optional(),
//   loser: entrySchema
//     .omit({
//       draws: true
//     })
//     .extend({
//       team: array(
//         personSchema.extend({
//           rank: intToNumberSchema.optional()
//         })
//       )
//     })
//     .optional(),
//   tour: TourEnum.transform(val => tourEnum[val]),
//   t1: entrySchema
//     .omit({
//       draws: true
//     })
//     .extend({
//       team: array(
//         personSchema.extend({
//           rank: intToNumberSchema.optional()
//         })
//       )
//     })
//     .optional(),
//   t2: entrySchema
//     .omit({
//       draws: true
//     })
//     .extend({
//       team: array(
//         personSchema.extend({
//           rank: intToNumberSchema.optional()
//         })
//       )
//     })
//     .optional(),
//   team1: scoreFormSchema.optional(),
//   team2: scoreFormSchema.optional(),
//   winning_team: literal(["t1", "t2"]).optional()
// })
// export type MatchType = z.infer<typeof matchSchema>

// export const resultMatchSchema = matchSchema
//   .pick({
//     id: true,
//     noOfSets: true,
//     match_no: true,
//     duration: true,
//     date: true,
//     court: true,
//     draw: true,
//     type: true,
//     round: true,
//     round_no: true,
//     umpire: true,
//     stats: true,
//     incomplete: true,
//     sets: true,
//     winner: true,
//     loser: true,
//     tour: true
//   })
//   .required({
//     winner: true,
//     loser: true
//   })
// export type ResultMatchType = z.infer<typeof resultMatchSchema>

// export const eventDrawLinksSchema = eventSchema.pick({
//   s_draw: true,
//   d_draw: true,
//   qs_draw: true,
//   qd_draw: true,
//   s_link: true,
//   d_link: true,
//   qs_link: true,
//   qd_link: true,
//   tour: true
// })

// export const editionDrawLinksSchema = editionSchema
//   .pick({
//     draw_type: true,
//     draw_link: true
//   })
//   .extend({
//     events: array(eventDrawLinksSchema)
//   })

// export const drawMatchSchema = matchSchema.pick({
//   id: true,
//   match_no: true,
//   date: true,
//   duration: true,
//   court: true,
//   round: true,
//   umpire: true,
//   winning_team: true,
//   incomplete: true,
//   t1: true,
//   t2: true,
//   team1: true,
//   team2: true
// })

// export const rawMatchSchema = matchSchema
//   .pick({
//     noOfSets: true,
//     umpire: true,
//     round: true,
//     t1: true,
//     t2: true,
//     winning_team: true,
//     team1: true,
//     team2: true,
//     id: true,
//     match_no: true,
//     duration: true,
//     date: true,
//     court: true,
//     incomplete: true
//   })
//   .required({
//     t1: true,
//     t2: true,
//     team1: true,
//     team2: true,
//     winning_team: true
//   })
//   .extend({
//     surface: surfaceSchema,
//     start_date: neoDateToStringSchema,
//     end_date: neoDateToStringSchema,
//     tournament: string()
//   })
// export type RawMatchType = z.infer<typeof rawMatchSchema>
