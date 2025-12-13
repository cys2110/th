import { array, object, string } from "zod"
import { tournamentSchema } from "./tournamentSchemas"
import { personSchema } from "./schemas"

export const yearsSchema = object({
  tournaments: array(
    tournamentSchema
      .omit({
        tours: true
      })
      .extend({
        type: string()
      })
  ),
  players: array(
    personSchema
      .pick({
        id: true,
        first_name: true,
        last_name: true,
        country: true
      })
      .extend({
        type: string()
      })
  )
})
