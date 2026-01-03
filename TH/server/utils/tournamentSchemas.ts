import { array, number, object, string, url, z } from "zod"

export const tournamentQuerySchema = paginationSchema.extend({
  abolished: number()
    .nullish()
    .default(null)
    .transform(val => {
      if (val) return numberToIntSchema.parse(val)
      return null
    }),
  established: number()
    .nullish()
    .default(null)
    .transform(val => {
      if (val) return numberToIntSchema.parse(val)
      return null
    }),
  tournaments: array(optionSchema).default([]),
  tours: array(TourInputEnum).default([])
})

export const tournamentFormSchema = object({
  id: numberToIntSchema,
  name: string().optional(),
  tours: array(TourInputEnum).optional(),
  established: numberToIntSchema.nullish(),
  abolished: numberToIntSchema.nullish(),
  website: url().nullish()
}).transform(data => {
  const { name, website, ...rest } = data

  const newObject = {
    ...rest,
    tournament: {
      name,
      website
    }
  }

  Object.keys(newObject.tournament).forEach(key => {
    if (newObject.tournament[key as keyof typeof newObject.tournament] === undefined) {
      delete newObject.tournament[key as keyof typeof newObject.tournament]
    }
  })

  return newObject
})
