/**
 * @module shared/types/playerSchemas
 * @description Player schemas shared across client and server side
 * @see module shared/types/schemas
 * @see module shared/types/enums
 */

import { array, boolean, literal, number, object, string, url, z } from "zod"
import { coachSchema, countrySchema, intToNumberSchema, neoDateToStringSchema, personSchema, surfaceSchema } from "./schemas"
import { RoundEnum, tourEnumTransform } from "./enums"

/** Describes the schema for a player with its full details */
export const playerSchema = personSchema.extend({
  age: intToNumberSchema.optional(),
  bh: literal(["One", "Two"]).optional(),
  ch_doubles: intToNumberSchema.optional(),
  ch_singles: intToNumberSchema.optional(),
  coaches: array(coachSchema),
  current_doubles: intToNumberSchema.optional(),
  current_singles: intToNumberSchema.optional(),
  dob: neoDateToStringSchema.optional(),
  dod: neoDateToStringSchema.optional(),
  doubles_ch_date: neoDateToStringSchema.optional(),
  former_coaches: array(coachSchema),
  former_countries: array(countrySchema),
  height: intToNumberSchema.optional(),
  hof: intToNumberSchema.optional(),
  max_year: intToNumberSchema,
  min_year: intToNumberSchema,
  official_link: url().optional(),
  pm: intToNumberSchema.optional(),
  retired: intToNumberSchema.optional(),
  rh: literal(["Right", "Left"]).optional(),
  singles_ch_date: neoDateToStringSchema.optional(),
  site_link: url().optional(),
  tour: tourEnumTransform,
  turned_pro: intToNumberSchema.optional(),
  updated_at: neoDateToStringSchema,
  wiki_link: url().optional(),
  years: array(intToNumberSchema)
})

/** Describes the schema for a player with its basic details */
export const basePlayerSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  country: true,
  coaches: true,
  max_year: true,
  min_year: true,
  tour: true
})
/** @type {BasePlayerType} */
export type BasePlayerType = z.infer<typeof basePlayerSchema>

/** Describes a schema for a player with its overview details */
export const playerOverviewSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  official_link: true,
  site_link: true,
  wiki_link: true,
  tour: true,
  country: true,
  years: true
})
/** @type {PlayerOverviewType} */
export type PlayerOverviewType = z.infer<typeof playerOverviewSchema>

/** Describes a schema for a player's details */
export const playerDetailsSchema = playerSchema.omit({
  max_year: true,
  min_year: true,
  years: true
})
/** @type {PlayerDetailsType} */
export type PlayerDetailsType = z.infer<typeof playerDetailsSchema>

/** Describes the schema for a player's win-loss record */
const wlMainSchema = object({
  singles: object({
    wl: string(),
    titles: number()
  }),
  doubles: object({
    wl: string(),
    titles: number()
  })
})

export const wlSchema = object({
  label: string(),
  total: wlMainSchema,
  main: wlMainSchema,
  qualifying: object({
    singles: string(),
    doubles: string()
  })
})
/** @type {WLType} */
export type WLType = z.infer<typeof wlSchema>

/** Describes the schema for a player's head to head records against another player */
export const playerH2HSchema = object({
  opponent: personSchema,
  wins: intToNumberSchema,
  losses: intToNumberSchema
})
/** @type {PlayerH2HType} */
export type PlayerH2HType = z.infer<typeof playerH2HSchema>

/** Describes the schema for a player's win-loss index */
export const wlIndexMatchSchema = object({
  surface: surfaceSchema,
  round: RoundEnum,
  noOfSets: intToNumberSchema,
  year: intToNumberSchema,
  category: string().nullable(),
  win: boolean(),
  opponent: object({
    s1: intToNumberSchema.nullish(),
    s2: intToNumberSchema.nullish(),
    s3: intToNumberSchema.nullish(),
    s4: intToNumberSchema.nullish(),
    s5: intToNumberSchema.nullish(),
    rh: string().nullable(),
    rank: intToNumberSchema.nullable()
  }),
  score: object({
    s1: intToNumberSchema.nullish(),
    s2: intToNumberSchema.nullish(),
    s3: intToNumberSchema.nullish(),
    s4: intToNumberSchema.nullish(),
    s5: intToNumberSchema.nullish()
  })
})
