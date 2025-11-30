import { array, boolean, literal, object, string, z } from "zod"
import { countrySchema, IncompleteEnum, intToNumberSchema, LevelEnum, RoundEnum, surfaceSchema, tourEnum, TourEnum } from "./schemas"
import { tournamentSchema } from "./tournamentSchemas"
import { playerSchema } from "./playerSchemas"

export const h2hBaseSchema = object({
  player: object({
    id: string(),
    first_name: string(),
    last_name: string(),
    current_singles: intToNumberSchema,
    country: countrySchema
  }),
  h2h: array(
    object({
      opponent: object({
        id: string(),
        first_name: string(),
        last_name: string(),
        current_singles: intToNumberSchema,
        country: countrySchema
      }),
      wins: intToNumberSchema,
      matches: intToNumberSchema
    })
  )
})
export type H2HBaseType = z.infer<typeof h2hBaseSchema>

export const h2hTeamSchema = object({
  titles: intToNumberSchema,
  wins: intToNumberSchema,
  losses: intToNumberSchema,
  tour_wins: intToNumberSchema,
  tour_losses: intToNumberSchema,
  tour_titles: intToNumberSchema,
  players: array(playerSchema)
})
export type H2HTeamType = z.infer<typeof h2hTeamSchema>

export const h2hMatchSchema = object({
  winning_team: literal(["t1", "t2"]).nullish(),
  round: RoundEnum,
  incomplete: IncompleteEnum.nullish(),
  stats: boolean(),
  surface: surfaceSchema.nullish(),
  year: intToNumberSchema,
  tournament: tournamentSchema,
  id: intToNumberSchema,
  match_no: intToNumberSchema,
  level: LevelEnum,
  sets: array(array(array(intToNumberSchema.nullable()))),
  tour: TourEnum.transform(val => tourEnum[val])
})
export type H2HMatchType = z.infer<typeof h2hMatchSchema>
