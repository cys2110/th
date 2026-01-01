

import { object, string, z } from "zod"
import { intToNumberSchema } from "./schemas"


export const tournamentSchema = object({
  id: intToNumberSchema,
  name: string()
})

export type TournamentType = z.infer<typeof tournamentSchema>


export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true
})

export type BaseTournamentType = z.infer<typeof baseTournamentSchema>
