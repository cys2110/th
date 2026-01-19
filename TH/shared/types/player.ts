import { array, literal, number, object, string, union, url, z } from "zod"
import { coachSchema, countrySchema, groupedResultsSchema, intToNumberSchema, neoDateToStringSchema, personSchema } from "./schemas"
import { tourEnum } from "./enums"

export const playerSchema = personSchema.extend({
  age: intToNumberSchema.optional(),
  bh: literal(["One", "Two"]).optional(),
  ch_doubles: intToNumberSchema.optional(),
  ch_singles: intToNumberSchema.optional(),
  coaches: array(coachSchema).default([]),
  current_doubles: intToNumberSchema.optional(),
  current_singles: intToNumberSchema.optional(),
  dob: neoDateToStringSchema.optional(),
  dod: neoDateToStringSchema.optional(),
  doubles_ch_date: neoDateToStringSchema.optional(),
  former_coaches: array(coachSchema).default([]),
  former_countries: array(countrySchema).default([]),
  height: intToNumberSchema.optional(),
  hof: intToNumberSchema.optional(),
  max_year: intToNumberSchema.optional(),
  min_year: intToNumberSchema.optional(),
  official_link: url().optional(),
  pm: intToNumberSchema.optional(),
  retired: intToNumberSchema.optional(),
  rh: literal(["Right", "Left"]).optional(),
  singles_ch_date: neoDateToStringSchema.optional(),
  site_link: url().optional(),
  tour: tourEnum,
  turned_pro: intToNumberSchema.optional(),
  updated_at: neoDateToStringSchema,
  wiki_link: url().optional(),
  years: array(intToNumberSchema)
})

export type PlayerType = z.infer<typeof playerSchema>

export const playerSearchSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    country: true,
    tour: true
  })
  .required({
    id: true,
    first_name: true,
    last_name: true,
    country: true,
    tour: true
  })

export type PlayerSearchType = z.infer<typeof playerSearchSchema>

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

export type BasePlayerType = z.infer<typeof basePlayerSchema>

export const groupedPlayerResultsSchema = groupedResultsSchema.extend({
  group: union([countrySchema, object({ year: intToNumberSchema })]),
  subRows: array(basePlayerSchema)
})

export type GroupedPlayerResultsType = z.infer<typeof groupedPlayerResultsSchema>

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

export type PlayerOverviewType = z.infer<typeof playerOverviewSchema>

export const playerDetailsSchema = playerSchema.omit({
  max_year: true,
  min_year: true,
  years: true
})

export type PlayerDetailsType = z.infer<typeof playerDetailsSchema>

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

export type PlayerWLType = z.infer<typeof wlSchema>

export const playerH2HSchema = object({
  opponent: personSchema,
  wins: intToNumberSchema,
  losses: intToNumberSchema
})

export type PlayerH2HType = z.infer<typeof playerH2HSchema>
