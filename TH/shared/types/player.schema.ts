import { array, literal, object, union, url, z } from "zod"

export const playerSchema = personSchema
  .omit({
    country: true
  })
  .extend({
    age: intToNumberSchema.optional(),
    bh: literal(["One", "Two"], "Backhand has be one of: One or Two").optional(),
    ch_doubles: intToNumberSchema.optional(),
    ch_singles: intToNumberSchema.optional(),
    coaches: array(coachSchema).default([]),
    country: countrySchema.extend({
      start_date: neoDateToStringSchema.optional()
    }),
    current_doubles: intToNumberSchema.optional(),
    current_singles: intToNumberSchema.optional(),
    dob: neoDateToStringSchema.optional(),
    dod: neoDateToStringSchema.optional(),
    doubles_ch_date: neoDateToStringSchema.optional(),
    former_coaches: array(coachSchema).default([]),
    former_countries: array(
      countrySchema.extend({
        start_date: neoDateToStringSchema.optional(),
        end_date: neoDateToStringSchema.optional()
      })
    ).default([]),
    height: intToNumberSchema.optional(),
    hof: intToNumberSchema.optional(),
    max_year: intToNumberSchema.optional(),
    min_year: intToNumberSchema.optional(),
    official_link: url("Official link must be a valid URL").optional(),
    pm: intToNumberSchema.optional(),
    retired: intToNumberSchema.optional(),
    rh: literal(["Right", "Left"], "Handedness has be one of: Right or Left").optional(),
    singles_ch_date: neoDateToStringSchema.optional(),
    site_link: url("Site link must be a valid URL"),
    turned_pro: intToNumberSchema.optional(),
    updated_at: neoDateToStringSchema,
    wiki_link: url("Wiki link must be a valid URL").optional(),
    tour: TourEnum,
    years: array(intToNumberSchema)
  })

export type PlayerType = z.infer<typeof playerSchema>

export const playerSearchSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  country: true,
  tour: true
})

export type PlayerSearchType = z.infer<typeof playerSearchSchema>

export const basePlayerSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  country: true,
  coaches: true,
  max_year: true,
  min_year: true,
  tour: true
})

export type BasePlayerType = z.infer<typeof basePlayerSchema>

export const groupedPlayerResultsSchema = groupedResultsSchema.extend({
  group: union([countrySchema, object({ year: intToNumberSchema })]),
  subRows: array(basePlayerSchema)
})

export type GroupedPlayerResultsType = z.infer<typeof groupedPlayerResultsSchema>
