import { number, object, string, union } from "zod"

export const optionSchema = object({
  label: string("Label is required"),
  value: union([string(), number()], "Value must be a string or number")
})

export type OptionType = ReturnType<typeof optionSchema.parse>
