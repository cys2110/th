import { CalendarDate } from "@internationalized/date"
import { literal, number, object, string, union, z } from "zod"

export const optionSchema = object({
  label: string(),
  value: union([string(), number()])
})

export type OptionType = z.infer<typeof optionSchema>

export const dateRangeSchema = object({
  start: z.instanceof(CalendarDate).optional(),
  end: z.instanceof(CalendarDate).optional()
})

export const personFormSchema = object({
  id: string().optional(),
  first_name: string("Please enter a first name"),
  last_name: string("Please enter a last name"),
  type: literal(["Supervisor", "Coach", "Umpire"])
}).transform(data => ({
  ...data,
  id: data.id ?? `${data.first_name} ${data.last_name}`.trim()
}))

export type PersonFormSchema = z.infer<typeof personFormSchema>

export const venueFormSchema = z
  .object({
    id: string().optional(),
    name: string().optional(),
    city: string("Please enter a city"),
    country: optionSchema.refine(val => val, {
      message: "Please select a country"
    })
  })
  .transform(data => {
    let id = data.id

    if (!id) {
      if (data.name) {
        id = data.name.includes(data.city) ? data.name : `${data.name}, ${data.city}`
      } else {
        id = data.city
      }
    }

    return {
      ...data,
      id
    }
  })

export type VenueFormInput = z.input<typeof venueFormSchema>
export type VenueFormSchema = z.infer<typeof venueFormSchema>
