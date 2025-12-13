import { array, object, string, url } from "zod"
import { dateRangeSchema } from "./schemas"

export const editionFormSchema = object({
  id: numberToIntSchema,
  tournament: numberToIntSchema.optional(),
  tours: array(string()).optional(),
  surface: string().nullish(),
  year: numberToIntSchema.optional(),
  sponsor_name: string().nullish(),
  category: string().nullish(),
  currency: optionSchema.nullish(),
  tfc: numberToIntSchema.nullish(),
  draw_type: string().nullish(),
  draw_link: url().nullish(),
  wiki_link: url().nullish(),
  venues: array(optionSchema).optional(),
  dates: dateRangeSchema.optional()
}).transform(data => {
  const { id, tournament, tours, surface, year, venues, dates, ...rest } = data

  return {
    id,
    tournament,
    tours,
    surface,
    year,
    venues,
    edition: {
      ...rest,
      start_date: dates?.start,
      end_date: dates?.end
    }
  }
})
