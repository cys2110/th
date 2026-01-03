import { array, object, string, url, z } from "zod"
import { intToNumberSchema, neoDateToStringSchema } from "./schemas"
import { tourEnumTransform } from "./enums"

export const tournamentSchema = object({
  abolished: intToNumberSchema.optional(),
  established: intToNumberSchema.optional(),
  id: intToNumberSchema,
  name: string(),
  tours: array(tourEnumTransform),
  updated_at: neoDateToStringSchema,
  website: url().optional()
})

export type TournamentType = z.infer<typeof tournamentSchema>

export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true
})

export type BaseTournamentType = z.infer<typeof baseTournamentSchema>
