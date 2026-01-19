import { int } from "neo4j-driver"
import { array, number, object, string, union, url } from "zod"

export const playerFormSchema = object({
  id: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  country: object({
    name: optionSchema,
    start_date: dateToNeoDateSchema.optional()
  }).optional(),
  former_countries: array(
    object({
      name: optionSchema,
      dates: object({
        start: dateToNeoDateSchema.optional(),
        end: dateToNeoDateSchema.optional()
      })
    })
  ).nullish(),
  official_link: url().nullish(),
  wiki_link: url().nullish(),
  dob: dateToNeoDateSchema.nullish(),
  dod: dateToNeoDateSchema.nullish(),
  height: numberToIntSchema.nullish(),
  rh: string().nullish(),
  bh: string().nullish(),
  turned_pro: numberToIntSchema.nullish(),
  retired: numberToIntSchema.nullish(),
  hof: numberToIntSchema.nullish(),
  coaches: array(
    object({
      name: optionSchema,
      years: string().optional()
    })
  ).nullish(),
  former_coaches: array(
    object({
      name: optionSchema,
      years: string().optional()
    })
  ).nullish()
}).transform(data => {
  const { id, country, former_countries, turned_pro, retired, hof, coaches, former_coaches, ...rest } = data

  const newObject = {
    player: { ...rest },
    id,
    turned_pro,
    retired,
    hof,
    country:
      country ?
        {
          id: country.name,
          start_date: country.start_date ?? null
        }
      : undefined,
    former_countries:
      former_countries ?
        former_countries.map(c => ({
          id: c.name,
          start_date: c.dates?.start ?? null,
          end_date: c.dates?.end ?? null
        }))
      : undefined,
    coaches:
      coaches ?
        coaches.map(c => ({
          id: c.name,
          years: c.years ?? null
        }))
      : undefined,
    former_coaches:
      former_coaches ?
        former_coaches.map(c => ({
          id: c.name,
          years: c.years ?? null
        }))
      : undefined
  }

  Object.keys(newObject).forEach(key => {
    if (newObject[key as keyof typeof newObject] === undefined) {
      delete newObject[key as keyof typeof newObject]
    }
  })

  return newObject
})
