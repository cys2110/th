import { array, literal, number, object, string, url, z } from "zod"

export const tournamentFormSchema = object({
  abolished: yearSchema.optional(),
  established: yearSchema.optional(),
  id: number("Please enter a tournament ID").int("Please enter a valid tournament ID").positive("Please enter a valid tournament ID."),
  name: string("Please enter a tournament name."),
  tours: array(TourKey, `Tour must be one of: ${Object.keys(tourMapping).join(", ")}`).min(1, "Please select at least one tour."),
  website: url("Please enter a valid url").optional()
})

export type TournamentFormSchema = z.infer<typeof tournamentFormSchema>
