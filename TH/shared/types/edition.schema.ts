import { boolean, object, string, z } from "zod"

export const editionSchema = object({
  category: string().optional(),
  end_date: neoDateToStringSchema.optional(),
  id: intToNumberSchema,
  start_date: neoDateToStringSchema.optional(),
  surface: surfaceSchema.optional(),
  tournament: baseTournamentSchema,
  year: intToNumberSchema
})

export const playerRecentEventSchema = editionSchema
  .pick({
    category: true,
    end_date: true,
    id: true,
    start_date: true,
    surface: true,
    tournament: true,
    year: true
  })
  .required({
    end_date: true,
    start_date: true,
    surface: true
  })
  .extend({
    round: RoundEnum,
    title: boolean()
  })

export type PlayerRecentEventType = z.infer<typeof playerRecentEventSchema>
