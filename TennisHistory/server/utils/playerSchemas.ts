import { array, object, string, url } from "zod"
import { dateToNeoDateSchema, optionSchema } from "./schemas"

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
      }).optional()
    })
  ).nullish(),
  official_link: url().nullish(),
  wiki_link: url().nullish(),
  dob: dateToNeoDateSchema.optional(),
  dod: dateToNeoDateSchema.optional(),
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
  const { id, country, former_countries, coaches, former_coaches, hof, turned_pro, retired, ...rest } = data

  return {
    id,
    hof,
    country,
    former_countries: former_countries
      ? former_countries.map(country => ({
          name: country.name,
          dates: country.dates
            ? {
                start_date: country.dates.start,
                end_date: country.dates.end
              }
            : undefined
        }))
      : undefined,
    coaches,
    former_coaches,
    retired,
    turned_pro,
    player: {
      ...rest
    }
  }
})

export const playerRecordSchema = object({
  tournament: tournamentSchema.omit({
    tours: true
  }),
  round: RoundEnum,
  year: intToNumberSchema
})
