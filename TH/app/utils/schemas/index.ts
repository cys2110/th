import { literal, number, object, string, union, z } from "zod"

export const optionSchema = object({
  label: string("Label is required"),
  value: union([string(), number()], "Value must be a string or number")
})

export type OptionType = ReturnType<typeof optionSchema.parse>

export const personFormSchema = personSchema
  .pick({
    first_name: true,
    last_name: true
  })
  .extend({
    id: string().optional(),
    type: literal(["Supervisor", "Coach", "Umpire"], {
      error: iss => {
        if (iss.code === "invalid_value") {
          return `Type must be one of Supervisor, Coach, or Umpire. Received: ${iss.input}.`
        } else {
          return "Type is required."
        }
      }
    })
  })

export type PersonFormSchema = z.infer<typeof personFormSchema>

export const venueFormSchema = venueSchema
  .pick({
    name: true,
    city: true
  })
  .extend({
    id: string().optional(),
    country: optionSchema
  })

export type VenueFormSchema = z.infer<typeof venueFormSchema>
