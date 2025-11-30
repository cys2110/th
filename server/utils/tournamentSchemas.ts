import { array, object, string, url } from "zod"
import { numberToIntSchema } from "./schemas"

export const tournamentFormSchema = object({
  id: numberToIntSchema,
  name: string().optional(),
  tours: array(TourEnum).optional(),
  established: numberToIntSchema.nullish(),
  abolished: numberToIntSchema.nullish(),
  website: url().nullish()
})
