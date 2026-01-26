import { literal, number, object, string, union, z } from "zod"

export const optionSchema = object({
  label: string("Label is required"),
  value: union([string(), number()], "Value must be a string or number")
})

export type OptionType = z.infer<typeof optionSchema>

export const personFormSchema = personSchema
  .pick({
    first_name: true,
    last_name: true
  })
  .extend({
    id: string().optional(),
    type: literal(["Supervisor", "Coach", "Umpire"], {
      error: iss => `Type must be one of Supervisor, Coach, or Umpire. Received: ${iss.input}.`
    })
  })

export type PersonFormSchema = z.infer<typeof personFormSchema>

export const venueFormSchema = venueSchema
  .pick({
    name: true,
    id: true,
    city: true
  })
  .partial({
    id: true
  })
  .extend({
    country: optionSchema
  })

export type VenueFormSchema = z.infer<typeof venueFormSchema>
