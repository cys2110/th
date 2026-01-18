import { union } from "zod"
import { playerSearchSchema } from "./player"
import { baseTournamentSchema } from "./tournament"

export const searchResultsSchema = union([playerSearchSchema, baseTournamentSchema])
