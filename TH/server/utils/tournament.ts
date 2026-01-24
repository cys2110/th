import { array, number, object, string, url } from "zod"

export const tournamentQuerySchema = paginationSchema.extend({
  abolished: number()
    .nullable()
    .default(null)
    .transform(val => {
      if (!val) return null
      return numberToIntSchema.parse(val)
    }),
  established: number()
    .nullable()
    .default(null)
    .transform(val => {
      if (!val) return null
      return numberToIntSchema.parse(val)
    }),
  grouping: string().nullable().default(null),
  key: numberToIntSchema.nullable().default(null),
  tournaments: array(optionSchema).default([]),
  tours: array(TourEnum).default([])
})

export const tournamentFormSchema = object({
  abolished: numberToIntSchema.nullish(),
  established: numberToIntSchema.nullish(),
  id: numberToIntSchema,
  name: string(),
  tours: array(TourEnum).optional(),
  website: url().nullish()
}).transform(data => {
  const { name, website, ...rest } = data

  return {
    ...rest,
    tournament: {
      name,
      website
    }
  }
})
