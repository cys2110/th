import { type Database } from "~/types/database.types"
import { useChangeCase } from "@vueuse/integrations/useChangeCase"

type TourEnum = Database["tennis"]["Enums"]["tour_enum"]

export const useTournamentStore = defineStore("tournament", () => {
  const paramName = ref("")
  const tournamentName = ref("")

  const tours = ref<Array<TourEnum>>([])

  const editionId = ref<string>()

  const name = computed(() => {
    if (tournamentName.value) return tournamentName.value

    return useChangeCase(paramName.value, "capitalCase").value
  })

  return {
    name,
    tours,
    paramName,
    tournamentName,
    editionId
  }
})
