/**
 * @module server/utils/playerSchemas
 * @description This module defines and exports the player-related schemas used for server side validation
 * @see module server/utils/schemas
 */

import { array, object, string, union, url, z } from "zod"
import { dateToNeoDateSchema, numberToIntSchema, optionSchema, paginationSchema } from "./schemas"

/** Describes a schema for a player query */
export const playerQuerySchema = paginationSchema.extend({
  coaches: array(optionSchema).default([]),
  countries: array(optionSchema).default([]),
  grouping: array(string()).default([]),
  key: union([numberToIntSchema, string()]).nullable().default(null),
  players: array(optionSchema).default([]),
  tours: array(TourInputEnum).default([])
})

/** Describes a schema for a player win-loss index query */
export const wlIndexQuerySchema = object({
  id: string(),
  levels: array(LevelEnum).default([]),
  drawType: DrawEnum.nullable().default(null),
  years: array(numberToIntSchema).default([])
})

/** Describes the schema for a player's stats query */
export const playerStatsQuerySchema = object({
  id: string(),
  levels: array(LevelEnum).default([]),
  drawType: DrawEnum.nullable().default(null),
  years: array(numberToIntSchema).default([]),
  surfaces: array(SurfaceEnum).default([])
})

/** Describes a schema for backend validation of player form */
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

/** Describes a schema for the api response of a player record */
export const playerRecordSchema = object({
  tournament: baseTournamentSchema,
  round: RoundEnum,
  year: intToNumberSchema
})
