import { union, z } from "zod"
import { playerSearchSchema } from "./player"
import { baseTournamentSchema } from "./tournament"

export const searchResultsSchema = union([playerSearchSchema, baseTournamentSchema])

export type SearchResultsType = z.infer<typeof searchResultsSchema>
