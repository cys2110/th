import { array, object, string, union, url } from "zod"
import { dateToNeoDateSchema, numberToIntSchema, optionSchema, paginationSchema } from "./schemas"

export const playerQuerySchema = paginationSchema.extend({
  coaches: array(optionSchema).default([]),
  countries: array(optionSchema).default([]),
  grouping: array(string()).default([]),
  key: union([numberToIntSchema, string()]).nullable().default(null),
  players: array(optionSchema).default([]),
  tours: array(TourInputEnum).default([])
})

export const activityQuerySchema = object({
  id: string(),
  categories: array(string()).default([]),
  levels: array(LevelEnum).default([]),
  matchType: MatchTypeEnum.default("Singles"),
  surfaces: array(SurfaceEnum).default([]),
  tournaments: array(optionSchema).default([]),
  years: array(numberToIntSchema).default([])
})

export const wlIndexQuerySchema = object({
  id: string(),
  levels: array(LevelEnum).default([]),
  drawType: DrawEnum.nullable().default(null),
  years: array(numberToIntSchema).default([])
})

export const playerStatsQuerySchema = object({
  id: string(),
  levels: array(LevelEnum).default([]),
  drawType: DrawEnum.nullable().default(null),
  years: array(numberToIntSchema).default([]),
  surfaces: array(SurfaceEnum).default([])
})

export const playerFormSchema = object({
  id: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  country: object({
    name: optionSchema,
    start_date: dateToNeoDateSchema.optional()
  }),
  former_countries: array(
    object({
      name: optionSchema,
      dates: object({
        start: dateToNeoDateSchema.optional(),
        end: dateToNeoDateSchema.optional()
      }).optional()
    })
  ).nullish(),
  official_link: url().nullish(),
  wiki_link: url().nullish(),
  dob: dateToNeoDateSchema.nullish(),
  dod: dateToNeoDateSchema.nullish(),
  height: numberToIntSchema.nullish(),
  rh: string().nullish(),
  bh: string().nullish(),
  turned_pro: numberToIntSchema.nullish(),
  retired: numberToIntSchema.nullish(),
  hof: numberToIntSchema.nullish(),
  coaches: array(
    object({
      name: optionSchema,
      years: string().optional()
    })
  ).nullish(),
  former_coaches: array(
    object({
      name: optionSchema,
      years: string().optional()
    })
  ).nullish()
}).transform(data => {
  const { first_name, last_name, official_link, wiki_link, dob, dod, height, rh, bh, ...rest } = data

  const newObject = {
    ...rest,
    player: {
      first_name,
      last_name,
      official_link,
      wiki_link,
      dob,
      dod,
      height,
      rh,
      bh
    }
  }

  // Remove undefined values from player object in order not to reset values unintentionally
  Object.keys(newObject.player).forEach(key => {
    if (newObject.player[key as keyof typeof newObject.player] === undefined) {
      delete newObject.player[key as keyof typeof newObject.player]
    }
  })

  return newObject
})

export const playerRecordSchema = object({
  tournament: baseTournamentSchema,
  round: RoundEnum,
  year: intToNumberSchema
})
