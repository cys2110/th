import { array, boolean, literal, number, object, string, url, z } from "zod"
import {
  countrySchema,
  intToNumberSchema,
  LevelEnum,
  MatchTypeEnum,
  neoDateToStringSchema,
  personSchema,
  RoundEnum,
  surfaceSchema,
  tourEnum,
  TourEnum
} from "./schemas"
import { tournamentSchema } from "./tournamentSchemas"
import { eventSchema, teamEntrySchema } from "./eventSchemas"
import { matchSchema } from "./matchSchemas"

export const playerSchema = object({
  age: intToNumberSchema.optional(),
  bh: literal(["One", "Two"]).optional(),
  ch_doubles: intToNumberSchema.optional(),
  ch_singles: intToNumberSchema.optional(),
  coaches: array(personSchema).optional(),
  country: countrySchema
    .extend({
      start_date: neoDateToStringSchema.nullish()
    })
    .optional(),
  current_doubles: intToNumberSchema.optional(),
  current_singles: intToNumberSchema.optional(),
  dob: neoDateToStringSchema.optional(),
  dod: neoDateToStringSchema.optional(),
  doubles_ch_date: neoDateToStringSchema.optional(),
  first_name: string().optional(),
  former_coaches: array(personSchema).optional(),
  former_countries: array(
    countrySchema.extend({
      start_date: neoDateToStringSchema.optional(),
      end_date: neoDateToStringSchema.optional()
    })
  ).optional(),
  height: intToNumberSchema.optional(),
  hof: intToNumberSchema.optional(),
  id: string(),
  last_name: string().optional(),
  max_year: intToNumberSchema.optional(),
  min_year: intToNumberSchema.optional(),
  official_link: url().optional(),
  pm: intToNumberSchema.optional(),
  retired: intToNumberSchema.optional(),
  rh: literal(["Right", "Left"]).optional(),
  singles_ch_date: neoDateToStringSchema.optional(),
  site_link: url().optional(),
  tour: TourEnum.transform(val => tourEnum[val]).optional(),
  turned_pro: intToNumberSchema.optional(),
  updated_at: neoDateToStringSchema.optional(),
  wiki_link: url().optional(),
  years: array(intToNumberSchema).optional()
})
export type PlayerType = z.infer<typeof playerSchema>

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
export type WlType = z.infer<typeof wlSchema>

export const playerH2HSchema = object({
  opponent: personSchema,
  matches: intToNumberSchema,
  wins: intToNumberSchema
})
export type PlayerH2HType = z.infer<typeof playerH2HSchema>

export const titlesAndFinalsSchema = object({
  id: string(),
  tournament: tournamentSchema,
  type: MatchTypeEnum,
  category: string().nullable(),
  year: intToNumberSchema,
  start_date: neoDateToStringSchema,
  date: neoDateToStringSchema,
  surface: surfaceSchema,
  level: LevelEnum
}).transform(data => {
  const [editionId, tour] = data.id.split("-")
  return {
    ...data,
    id: editionId as string,
    tour: tour as string
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

export const yearStatsSchema = object({
  singles_wins: intToNumberSchema,
  singles_losses: intToNumberSchema,
  doubles_wins: intToNumberSchema,
  doubles_losses: intToNumberSchema,
  singles_titles: intToNumberSchema,
  doubles_titles: intToNumberSchema
})

const activityMatchSchema = matchSchema
  .pick({
    id: true,
    match_no: true,
    round: true,
    incomplete: true,
    sets: true,
    winning_team: true,
    draw: true,
    stats: true
  })
  .extend({
    opponent: teamEntrySchema.nullish()
  })
export type ActivityMatchType = z.infer<typeof activityMatchSchema>

export const activitySchema = eventSchema
  .pick({
    tour: true,
    surface: true,
    level: true,
    sponsor_name: true,
    category: true,
    start_date: true,
    end_date: true,
    venues: true,
    currency: true
  })
  .extend({
    id: intToNumberSchema,
    type: MatchTypeEnum,
    year: intToNumberSchema,
    tournament: tournamentSchema,
    partner: personSchema.nullish(),
    player: teamEntrySchema
      .pick({
        id: true,
        seed: true,
        q_seed: true,
        status: true,
        q_status: true
      })
      .extend({
        points: intToNumberSchema.nullish(),
        pm: intToNumberSchema.nullish(),
        rank: intToNumberSchema.nullish()
      }),
    match: activityMatchSchema
  })
export type ActivityType = z.infer<typeof activitySchema>

const consolidatedActivitySchema = activitySchema.omit({ match: true }).extend({
  match: activityMatchSchema.array()
})
export type ConsolidatedActivityType = z.infer<typeof consolidatedActivitySchema>
