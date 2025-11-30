import { array, object, string } from "zod"
import { tournamentSchema } from "./tournamentSchemas"
import { personSchema } from "./schemas"

export const yearsSchema = object({
  tournaments: array(
    tournamentSchema.extend({
      type: string()
    })
  ),
  players: array(
    personSchema.extend({
      type: string()
    })
  )
})
