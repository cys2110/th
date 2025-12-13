import { array, object, string, url, z } from "zod"
import {
  countrySchema,
  CurrencyEnum,
  intToNumberSchema,
  MatchTypeEnum,
  neoDateToStringSchema,
  personSchema,
  RoundEnum,
  StatusEnum,
  TourEnum,
  tourEnum
} from "./schemas"

export const tournamentSchema = object({
  id: intToNumberSchema,
  name: string(),
  tours: array(TourEnum.transform(val => tourEnum[val])),
  established: intToNumberSchema.optional(),
  abolished: intToNumberSchema.optional(),
  website: url().optional(),
  updated_at: neoDateToStringSchema.optional()
})
export type TournamentType = z.infer<typeof tournamentSchema>

export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true,
  tours: true
})
export type BaseTournamentType = z.infer<typeof baseTournamentSchema>

export const tournamentSeedSchema = object({
  id: intToNumberSchema,
  year: intToNumberSchema,
  round: RoundEnum,
  type: MatchTypeEnum,
  tour: TourEnum.transform(val => tourEnum[val]),
  players: array(
    object({
      seed: intToNumberSchema,
      team: array(personSchema)
    })
  )
})

export const tournamentStatusSchema = object({
  tour: TourEnum.transform(val => tourEnum[val]),
  status: StatusEnum,
  year: intToNumberSchema,
  type: MatchTypeEnum,
  id: intToNumberSchema,
  team: array(personSchema)
})

export const tournamentLowestRankedSchema = personSchema.extend({
  edId: intToNumberSchema,
  year: intToNumberSchema,
  rank: intToNumberSchema,
  round: RoundEnum,
  tour: TourEnum.transform(val => tourEnum[val])
})
export type TournamentLowestRankedType = z.infer<typeof tournamentLowestRankedSchema>

export const tournamentFinalistSchema = personSchema.extend({
  tour: TourEnum.transform(val => tourEnum[val]),
  singles_wins: intToNumberSchema,
  singles_losses: intToNumberSchema,
  doubles_wins: intToNumberSchema,
  doubles_losses: intToNumberSchema
})
export type TournamentFinalistType = z.infer<typeof tournamentFinalistSchema>

export const tournamentScoresStatsSchema = object({
  type: MatchTypeEnum,
  tour: TourEnum.transform(val => tourEnum[val]),
  year: intToNumberSchema,
  id: intToNumberSchema,
  sets_won: intToNumberSchema,
  sets_lost: intToNumberSchema,
  games_won: intToNumberSchema,
  games_lost: intToNumberSchema,
  team: array(personSchema)
})
export type TournamentScoresStatsType = z.infer<typeof tournamentScoresStatsSchema>

export const tournamentAgeSchema = personSchema.extend({
  edId: intToNumberSchema,
  year: intToNumberSchema,
  type: MatchTypeEnum,
  tour: TourEnum.transform(val => tourEnum[val]),
  age: object({
    months: intToNumberSchema,
    days: intToNumberSchema
  })
})
export type TournamentAgeType = z.infer<typeof tournamentAgeSchema>

export const tournamentCountrySchema = object({
  country: countrySchema,
  atp_singles_wins: intToNumberSchema,
  atp_doubles_wins: intToNumberSchema,
  wta_singles_wins: intToNumberSchema,
  wta_doubles_wins: intToNumberSchema,
  total_atp_singles_wins: intToNumberSchema,
  total_atp_doubles_wins: intToNumberSchema,
  total_wta_singles_wins: intToNumberSchema,
  total_wta_doubles_wins: intToNumberSchema
})
export type TournamentCountryType = z.infer<typeof tournamentCountrySchema>

export const tournamentCountryChartSchema = object({
  country: string(),
  year: intToNumberSchema,
  player: string(),
  tour: TourEnum.transform(val => tourEnum[val]),
  type: MatchTypeEnum
})

export const tournamentPmSchema = object({
  tour: TourEnum.transform(val => tourEnum[val]),
  type: MatchTypeEnum,
  currency: CurrencyEnum,
  year: intToNumberSchema,
  id: intToNumberSchema,
  pm: intToNumberSchema.optional(),
  points: intToNumberSchema.optional(),
  round: RoundEnum,
  number: intToNumberSchema
})
export type TournamentPmType = z.infer<typeof tournamentPmSchema>
