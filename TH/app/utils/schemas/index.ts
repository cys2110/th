/**
 * @module app/utils/schemas
 * @description Client specific schemas - References no other files to avoid circular dependencies
 */

import { literal, number, object, string, union, z } from "zod"

/** Describes a schema for a select option */
export const optionSchema = object({
  label: string(),
  value: union([string(), number()])
})
/** @type {OptionType} */
export type OptionType = z.infer<typeof optionSchema>

/** Describes the schema for front end validation of person form */
export const personFormSchema = object({
  id: string().optional(),
  first_name: string("Please enter a first name"),
  last_name: string("Please enter a last name"),
  type: literal(["Supervisor", "Coach", "Umpire"])
}).transform(data => ({
  ...data,
  id: data.id ?? `${data.first_name} ${data.last_name}`.trim()
}))
/** @type {PersonFormSchema} */
export type PersonFormSchema = z.infer<typeof personFormSchema>
