import { array, object, string, url } from "zod"
import { dateRangeSchema } from "./schemas"

export const editionFormSchema = object({
  id: numberToIntSchema,
  tournament: numberToIntSchema.optional(),
  tours: array(TourInputEnum).optional(),
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

  const newObject = {
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

  // Remove undefined fields from edition
  Object.keys(newObject).forEach(key => {
    if (newObject[key as keyof typeof newObject] === undefined) {
      delete newObject[key as keyof typeof newObject]
    }
  })

  Object.keys(newObject.edition).forEach(key => {
    if (newObject.edition[key as keyof typeof newObject.edition] === undefined) {
      delete newObject.edition[key as keyof typeof newObject.edition]
    }
  })

  return newObject
})
