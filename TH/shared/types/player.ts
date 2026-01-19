import { z } from "zod"
import { TourEnum } from "./enums"
import { personSchema } from "./schemas"

export const playerSchema = personSchema.extend({
  tour: TourEnum
})

export const playerSearchSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  country: true,
  tour: true
})

export type PlayerSearchType = z.infer<typeof playerSearchSchema>
