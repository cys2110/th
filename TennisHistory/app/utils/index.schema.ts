import { object, string, z } from "zod"

export const countrySchema = object({
  id: string("IOC code is required"),
  name: string("Name is required"),
  continent: ContinentEnum,
  icon: string("Icon is required")
})
export type CountrySchema = z.infer<typeof countrySchema>
