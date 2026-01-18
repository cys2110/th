import { number, object, string, union, z } from "zod"

export const optionSchema = object({
  label: string(),
  value: union([string(), number()])
})

export type OptionType = z.infer<typeof optionSchema>
