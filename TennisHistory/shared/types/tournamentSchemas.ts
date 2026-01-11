import { array, boolean, intersection, number, object, string, url, z } from "zod"
import { countrySchema, intToNumberSchema, neoDateToStringSchema, personSchema } from "./schemas"
import { CurrencyEnum, MatchTypeEnum, RoundEnum, StatusEnum, tourEnumTransform } from "./enums"

export const tournamentSchema = object({
  abolished: intToNumberSchema.optional(),
  established: intToNumberSchema.optional(),
  id: intToNumberSchema,
  name: string(),
  tours: array(tourEnumTransform),
  updated_at: neoDateToStringSchema.optional(),
  website: url().optional()
})

export type TournamentType = z.infer<typeof tournamentSchema>

export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true
})

export type BaseTournamentType = z.infer<typeof baseTournamentSchema>

export const tournamentPmSchema = object({
  tour: tourEnumTransform,
  type: MatchTypeEnum,
  currency: CurrencyEnum.optional(),
  year: intToNumberSchema,
  id: intToNumberSchema,
  pm: intToNumberSchema.optional(),
  points: intToNumberSchema.optional(),
  round: RoundEnum,
  number: intToNumberSchema
})

export type TournamentPmType = z.infer<typeof tournamentPmSchema>

export const tournamentFinalistsSchema = personSchema.extend({
  tour: tourEnumTransform,
  type: MatchTypeEnum,
  year: intToNumberSchema,
  edId: intToNumberSchema,
  title: boolean()
})

export type TournamentFinalistsType = z.infer<typeof tournamentFinalistsSchema>

const tournamentCountryObjectSchema = z.record(
  string(),
  object({
    distinct_singles_wins: number(),
    distinct_doubles_wins: number(),
    singles_wins: number(),
    doubles_wins: number()
  })
)

export const tournamentCountrySchema = intersection(countrySchema, tournamentCountryObjectSchema)

export type TournamentCountryType = z.infer<typeof tournamentCountrySchema>

export const tournamentFinalistSchema = personSchema.extend({
  tour: tourEnumTransform,
  singles_wins: number(),
  doubles_wins: number(),
  singles_losses: number(),
  doubles_losses: number()
})

export type TournamentFinalistType = z.infer<typeof tournamentFinalistSchema>

export const tournamentAgeSchema = personSchema.extend({
  edId: intToNumberSchema,
  year: intToNumberSchema,
  type: MatchTypeEnum,
  tour: tourEnumTransform,
  age: object({
    months: intToNumberSchema,
    days: intToNumberSchema
  })
})

export type TournamentAgeType = z.infer<typeof tournamentAgeSchema>

export const tournamentScoresStatsSchema = object({
  type: MatchTypeEnum,
  tour: tourEnumTransform,
  year: intToNumberSchema,
  id: intToNumberSchema,
  sets_won: intToNumberSchema,
  sets_lost: intToNumberSchema,
  games_won: intToNumberSchema,
  games_lost: intToNumberSchema,
  team: array(personSchema)
})

export type TournamentScoresStatsType = z.infer<typeof tournamentScoresStatsSchema>

export const tournamentSeedSchema = object({
  id: intToNumberSchema,
  players: array(
    object({
      seed: intToNumberSchema,
      team: array(personSchema)
    })
  ),
  round: RoundEnum,
  tour: tourEnumTransform,
  type: MatchTypeEnum,
  year: intToNumberSchema
})

export type TournamentSeedType = z.infer<typeof tournamentSeedSchema>

export const tournamentStatusSchema = object({
  id: intToNumberSchema,
  status: StatusEnum,
  team: array(personSchema),
  tour: tourEnumTransform,
  type: MatchTypeEnum,
  year: intToNumberSchema
})

export type TournamentStatusType = z.infer<typeof tournamentStatusSchema>

export const tournamentLowestRankedSchema = personSchema.extend({
  edId: intToNumberSchema,
  rank: intToNumberSchema,
  round: RoundEnum,
  tour: tourEnumTransform,
  year: intToNumberSchema
})

export type TournamentLowestRankedType = z.infer<typeof tournamentLowestRankedSchema>
