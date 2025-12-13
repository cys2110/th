import { array, object, string, url } from "zod"

export const tournamentFormSchema = object({
  id: numberToIntSchema,
  name: string().optional(),
  tours: array(TourEnum).optional(),
  established: numberToIntSchema.nullish(),
  abolished: numberToIntSchema.nullish(),
  website: url().nullish()
}).transform(data => ({
  id: data.id,
  tours: data.tours,
  established: data.established,
  abolished: data.abolished,
  tournament: {
    name: data.name,
    website: data.website
  }
}))
