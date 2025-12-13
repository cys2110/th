import { array, boolean, literal, number, object, string, url, z } from "zod"
import {
  coachSchema,
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
import { matchSchema } from "./matchSchemas"
import { entrySchema, eventSchema, teamEntrySchema } from "./eventSchemas"

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
  tour: TourEnum.transform(val => tourEnum[val]),
  turned_pro: intToNumberSchema.optional(),
  updated_at: neoDateToStringSchema,
  wiki_link: url().optional(),
  years: array(intToNumberSchema)
})
export type PlayerType = z.infer<typeof playerSchema>

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

export const playerDetailsSchema = playerSchema.omit({
  max_year: true,
  min_year: true,
  years: true
})
export type PlayerDetailsType = z.infer<typeof playerDetailsSchema>

export const titlesAndFinalsSchema = object({
  id: string(),
  tournament: tournamentSchema.omit({
    tours: true
  }),
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
    opponent: entrySchema
      .omit({ draws: true })
      .extend({
        team: array(
          personSchema.extend({
            rank: intToNumberSchema.optional()
          })
        )
      })
      .nullish()
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
    tournament: tournamentSchema.omit({ tours: true }),
    partner: personSchema.nullish(),
    player: entrySchema.omit({
      draws: true
    }),
    match: activityMatchSchema
  })
export type ActivityType = z.infer<typeof activitySchema>

const consolidatedActivitySchema = activitySchema.omit({ match: true }).extend({
  match: activityMatchSchema.array()
})
export type ConsolidatedActivityType = z.infer<typeof consolidatedActivitySchema>
