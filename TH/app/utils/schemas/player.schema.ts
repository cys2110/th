import { array, number, object, string, z } from "zod"
import { CalendarDate } from "@internationalized/date"

export const playerFormSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    official_link: true,
    wiki_link: true,
    rh: true,
    bh: true
  })
  .extend({
    country: object({
      id: optionSchema.nullable(),
      dates: object({
        start_date: z.instanceof(CalendarDate).nullable()
      })
    }),
    former_countries: array(
      object({
        id: optionSchema,
        dates: object({
          start: z.instanceof(CalendarDate).optional(),
          end: z.instanceof(CalendarDate).optional()
        })
      })
    ),
    coaches: array(
      object({
        id: optionSchema,
        dates: object({
          years: string().optional()
        })
      })
    ),
    former_coaches: array(
      object({
        id: optionSchema,
        dates: object({
          years: string().optional()
        })
      })
    ),
    dob: z.instanceof(CalendarDate).optional(),
    dod: z.instanceof(CalendarDate).optional(),
    height: number("Please enter a valid height in cm").positive("Height must be a positive number").optional(),
    turned_pro: yearSchema.optional(),
    retired: yearSchema.optional(),
    hof: yearSchema.optional()
  })

export type PlayerFormSchema = z.infer<typeof playerFormSchema>
