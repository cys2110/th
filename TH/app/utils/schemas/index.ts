import { literal, number, object, string, union, z } from "zod"

export const optionSchema = object({
  label: string(),
  value: union([string(), number()])
})

export type OptionType = z.infer<typeof optionSchema>

export const personFormSchema = object({
  id: string().optional(),
  first_name: string("Please enter a first name"),
  last_name: string("Please enter a last name"),
  type: literal(["Supervisor", "Coach", "Umpire"])
})

export type PersonFormSchema = z.infer<typeof personFormSchema>

export const venueFormSchema = object({
  id: string().optional(),
  name: string().optional(),
  city: string("Please enter a city"),
  country: optionSchema
})

export type VenueFormSchema = z.infer<typeof venueFormSchema>
