/**
 * @module app/utils/schemas/playerSchemas
 * @description Client specific schemas for player related data
 */

import { array, literal, number, object, string, url, z } from "zod"
import { CalendarDate } from "@internationalized/date"

/** Describes the schema for a player's country in player form */
export const countryFormSchema = object({
  name: optionSchema,
  start_date: z.instanceof(CalendarDate).optional()
})

/** Describes the schema for a player's former countries in player form */
export const formerCountryFormSchema = object({
  name: optionSchema,
  dates: object({
    start: z.instanceof(CalendarDate).optional(),
    end: z.instanceof(CalendarDate).optional()
  })
})

/** Describes the schema for a player's coach in player form */
export const coachFormSchema = object({
  name: optionSchema,
  years: string().optional()
})

/** Describes the schema for front end validation of player form */
export const playerFormSchema = object({
  id: string(),
  country: countryFormSchema,
  former_countries: array(formerCountryFormSchema).optional(),
  coaches: array(coachFormSchema).optional(),
  former_coaches: array(coachFormSchema).optional(),
  first_name: string("Please enter a first name"),
  last_name: string("Please enter a last name"),
  official_link: url("Please enter a valid URL").optional(),
  wiki_link: url("Please enter a valid URL").optional(),
  dob: z.instanceof(CalendarDate).optional(),
  dod: z.instanceof(CalendarDate).optional(),
  height: number("Please enter a valid height in cm").positive("Height must be a positive number").optional(),
  rh: literal(["Right", "Left"]).optional(),
  bh: literal(["One", "Two"]).optional(),
  turned_pro: yearSchema.optional(),
  retired: yearSchema.optional(),
  hof: yearSchema.optional()
})
/** @type {PlayerFormInput} */
export type PlayerFormInput = z.input<typeof playerFormSchema>
/** @type {PlayerFormSchema} */
export type PlayerFormSchema = z.infer<typeof playerFormSchema>
