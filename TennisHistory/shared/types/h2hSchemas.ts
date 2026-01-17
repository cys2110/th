import { array, boolean, literal, object, record, string, z } from "zod"
import { intToNumberSchema, surfaceSchema } from "./schemas"
import { baseTournamentSchema } from "./tournamentSchemas"
import { playerSchema } from "./playerSchemas"
import { IncompleteEnum, LevelEnum, RoundEnum, tourEnumTransform } from "./enums"

export const h2hPlayerSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    country: true,
    current_singles: true
  })
  .required({
    first_name: true,
    last_name: true,
    country: true,
    current_singles: true
  })

export type H2HPlayerType = z.infer<typeof h2hPlayerSchema>

export const h2hBaseSchema = record(string(), string())

export type H2HBaseType = z.infer<typeof h2hBaseSchema>

export const h2hTeamSchema = object({
  titles: intToNumberSchema,
  wins: intToNumberSchema,
  losses: intToNumberSchema,
  tour_wins: intToNumberSchema,
  tour_losses: intToNumberSchema,
  tour_titles: intToNumberSchema,
  players: array(
    playerSchema.pick({
      id: true,
      first_name: true,
      last_name: true,
      pm: true,
      rh: true,
      bh: true,
      dob: true,
      height: true,
      ch_singles: true,
      ch_doubles: true,
      country: true,
      tour: true
    })
  )
})

export type H2HTeamType = z.infer<typeof h2hTeamSchema>

export const h2hMatchSchema = object({
  winning_team: literal(["t1", "t2"]).optional(),
  round: RoundEnum,
  incomplete: IncompleteEnum.optional(),
  stats: boolean(),
  surface: surfaceSchema.optional(),
  year: intToNumberSchema,
  tournament: baseTournamentSchema,
  id: intToNumberSchema,
  match_no: intToNumberSchema,
  level: LevelEnum,
  sets: array(array(array(intToNumberSchema.nullable()))),
  tour: tourEnumTransform
})

export type H2HMatchType = z.infer<typeof h2hMatchSchema>
