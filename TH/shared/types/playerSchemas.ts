

import { array, boolean, literal, number, object, string, url, z } from "zod"
import { coachSchema, countrySchema, intToNumberSchema, neoDateToStringSchema, personSchema, surfaceSchema } from "./schemas"
import { MatchTypeEnum, RoundEnum, tourEnumTransform } from "./enums"
import { eventSchema } from "./eventSchemas"


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

export type WLType = z.infer<typeof wlSchema>


export const playerH2HSchema = object({
  opponent: personSchema,
  wins: intToNumberSchema,
  losses: intToNumberSchema
})

export type PlayerH2HType = z.infer<typeof playerH2HSchema>


export const titlesAndFinalsSchema = eventSchema
  .pick({
    id: true,
    tournament: true,
    category: true,
    year: true,
    start_date: true,
    end_date: true,
    surface: true,
    level: true
  })
  .required({
    surface: true,
    start_date: true,
    end_date: true
  })
  .extend({
    type: MatchTypeEnum,
    title: boolean()
  })
  .transform(data => {
    const [editionId, tour] = data.id.split("-")
    const { end_date, ...rest } = data

    return {
      ...rest,
      id: editionId as string,
      tour: tour as string,
      date: end_date
    }
  })

export type TitlesAndFinalsType = z.infer<typeof titlesAndFinalsSchema>


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
