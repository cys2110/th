import { z } from "zod"
import { personSchema } from "./schemas"
import { tourEnum } from "./enums"

export const playerSchema = personSchema.extend({
  tour: tourEnum
})

export type PlayerType = z.infer<typeof playerSchema>

export const playerSearchSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    country: true,
    tour: true
  })
  .required({
    id: true,
    first_name: true,
    last_name: true,
    country: true,
    tour: true
  })

export type PlayerSearchType = z.infer<typeof playerSearchSchema>
