import { array, number, object, string, url, z } from "zod"

export const editionFormSchema = object({
  id: number("Please enter an edition ID").int("Please enter a valid edition ID"),
  tournament: number(),
  tours: array(TourEnum, "Please select at least one tour").min(1, "Please select at least one tour"),
  surface: string().optional(),
  year: yearSchema,
  venues: array(optionSchema).optional(),
  currency: optionSchema.optional(),
  tfc: number("Please enter a valid money amount").positive("Total financial commitment must be a positive amount").optional(),
  wiki_link: url("Please enter a valid url").optional(),
  draw_type: string().optional(),
  draw_link: url("Please enter a valid URL").optional(),
  sponsor_name: string("Please enter a valid sponsor name").optional(),
  category: string("Please enter a valid category").optional(),
  dates: dateRangeSchema.optional()
})
export type EditionFormInput = z.input<typeof editionFormSchema>
export type EditionFormSchema = z.infer<typeof editionFormSchema>
