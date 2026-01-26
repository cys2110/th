import { array, literal, number, object, string, union, url, z } from "zod"
import { int } from "neo4j-driver"

export const playerQuerySchema = paginationSchema.extend({
  coaches: array(optionSchema).default([]),
  countries: array(optionSchema).default([]),
  grouping: string().nullable().default(null),
  key: union([numberToIntSchema, string()]).nullable().default(null),
  max_year: number()
    .nullable()
    .default(null)
    .transform(val => (val ? int(val) : null)),
  min_year: number()
    .nullable()
    .default(null)
    .transform(val => (val ? int(val) : null)),
  players: array(optionSchema).default([]),
  tours: array(TourEnum).default([])
})

export const playerCreateSchema = playerSchema.pick({
  id: true,
  tour: true
})

export type PlayerCreateSchema = z.infer<typeof playerCreateSchema>

export const playerFormSchema = object({
  id: string("ID is required"),
  first_name: string().optional(),
  last_name: string().optional(),
  country: object({
    id: optionSchema,
    dates: object({
      start_date: dateToNeoDateSchema.optional()
    })
  }).optional(),
  former_countries: array(
    object({
      id: optionSchema,
      dates: object({
        start: dateToNeoDateSchema.optional(),
        end: dateToNeoDateSchema.optional()
      })
    })
  ).nullish(),
  official_link: url("Official link must be a url").nullish(),
  wiki_link: url("Wiki link must be a url").nullish(),
  dob: dateToNeoDateSchema.nullish(),
  dod: dateToNeoDateSchema.nullish(),
  height: numberToIntSchema.nullish(),
  rh: literal(["Right", "Left"], "Handedness must be 'Right' or 'Left'").nullish(),
  bh: literal(["One", "Two"], "Backhand must be 'One' or 'Two'").nullish(),
  turned_pro: numberToIntSchema.nullish(),
  retired: numberToIntSchema.nullish(),
  hof: numberToIntSchema.nullish(),
  coaches: array(
    object({
      id: optionSchema,
      dates: object({
        years: string().optional()
      })
    })
  ).nullish(),
  former_coaches: array(
    object({
      id: optionSchema,
      dates: object({
        years: string().optional()
      })
    })
  ).nullish()
}).transform(data => {
  const { first_name, last_name, official_link, wiki_link, dob, dod, height, rh, bh, former_countries, ...rest } = data

  const newObject = {
    ...rest,
    former_countries: former_countries?.map(fc => ({
      ...fc,
      dates: {
        start_date: fc.dates.start ?? null,
        end_date: fc.dates.end ?? null
      }
    })),
    player: {
      first_name,
      last_name,
      official_link,
      wiki_link,
      dob,
      dod,
      height,
      rh,
      bh
    }
  }

  if (former_countries?.length === 0) {
    delete newObject.former_countries
  }

  return newObject
})
