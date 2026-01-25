import { z } from "zod"

export const playerSchema = personSchema.extend({
  ch_doubles: intToNumberSchema.optional(),
  ch_singles: intToNumberSchema.optional(),
  doubles_ch_date: neoDateToStringSchema.optional(),
  singles_ch_date: neoDateToStringSchema.optional(),
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
