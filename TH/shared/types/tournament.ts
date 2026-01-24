import { object, string, z } from "zod"

export const tournamentSchema = object({
  id: intToNumberSchema,
  name: string("Tournament name is required.")
})

export type TournamentType = z.infer<typeof tournamentSchema>

export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true
})

export type BaseTournamentType = z.infer<typeof baseTournamentSchema>
