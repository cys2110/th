import { array, boolean, int, object, string, z } from "zod"
import {
  eventSchema,
  intToNumberSchema,
  LevelEnum,
  matchSchema,
  MatchTypeEnum,
  neoDateToStringSchema,
  personSchema,
  RoundEnum,
  surfaceSchema,
  teamEntrySchema,
  tournamentSchema
} from "./schemas"

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
