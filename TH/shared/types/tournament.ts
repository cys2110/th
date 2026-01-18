import { array, object, string, url, z } from "zod"
import { intToNumberSchema, neoDateToStringSchema } from "./schemas"
import { tourEnum } from "./enums"

export const tournamentSchema = object({
  abolished: intToNumberSchema.optional(),
  established: intToNumberSchema.optional(),
  id: intToNumberSchema,
  name: string("Tournament name is required."),
  tours: array(tourEnum),
  updated_at: neoDateToStringSchema.optional(),
  website: url("Tournament website must be a valid url.").optional()
})

export type TournamentType = z.infer<typeof tournamentSchema>

export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true
})

export type BaseTournamentType = z.infer<typeof baseTournamentSchema>
