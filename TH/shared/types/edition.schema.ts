import { object, string } from "zod"

export const editionSchema = object({
  category: string().optional(),
  id: intToNumberSchema,
  tournament: baseTournamentSchema,
  year: intToNumberSchema
})
