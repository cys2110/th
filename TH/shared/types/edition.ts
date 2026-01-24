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

export type EditionType = z.infer<typeof editionSchema>

export const playerRecentEventSchema = editionSchema
  .pick({
    tournament: true,
    id: true,
    year: true,
    start_date: true,
    end_date: true,
    surface: true,
    category: true
  })
  .required({
    start_date: true,
    end_date: true,
    category: true,
    surface: true
  })
  .extend({
    round: RoundEnum,
    title: boolean()
  })

export type PlayerRecentEventType = z.infer<typeof playerRecentEventSchema>
