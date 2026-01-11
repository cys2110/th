import { array, number, object, string, url, z } from "zod"

export const editionFormSchema = object({
  category: string("Please enter a valid category").optional(),
  currency: optionSchema.optional(),
  dates: dateRangeSchema.optional(),
  draw_type: string().optional(),
  draw_link: url("Please enter a valid URL").optional(),
  id: number("Please enter an edition ID").int("Please enter a valid edition ID"),
  sponsor_name: string("Please enter a valid sponsor name").optional(),
  surface: string().optional(),
  tfc: number("Please enter a valid money amount").positive("Total financial commitment must be a positive amount").optional(),
  tournament: number(),
  tours: array(TourInputEnum, "Please select at least one tour").min(1, "Please select at least one tour"),
  venues: array(optionSchema).optional(),
  wiki_link: url("Please enter a valid url").optional(),
  year: yearSchema
})

export type EditionFormInput = z.input<typeof editionFormSchema>
export type EditionFormSchema = z.infer<typeof editionFormSchema>
