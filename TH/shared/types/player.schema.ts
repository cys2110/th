import { z } from "zod"

export const playerSchema = personSchema.extend({
  tour: TourEnum
})

export type PlayerType = z.infer<typeof playerSchema>

export const playerSearchSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  country: true,
  tour: true
})

export type PlayerSearchType = z.infer<typeof playerSearchSchema>
