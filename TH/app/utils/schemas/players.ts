import { object, string, z } from "zod"

export const playerCreateSchema = object({
  id: string("Player ID is required."),
  tour: TourKey
})

export type PlayerCreateSchema = z.infer<typeof playerCreateSchema>
