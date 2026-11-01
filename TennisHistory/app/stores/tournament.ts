import { type Database } from "~/types/database.types"
import { useChangeCase } from "@vueuse/integrations/useChangeCase"

interface IDs {
  mens: number | null
  womens: number | null
  edition: string | null
}

export const useTournamentStore = defineStore("tournament", () => {
  const paramName = ref("")
  const tournamentName = ref("")

  const tours = ref<Array<TourEnum>>([])

  const ids = ref<IDs>({
    mens: null,
    womens: null,
    edition: null
  })

  const name = computed(() => {
    if (tournamentName.value) return tournamentName.value

    return useChangeCase(paramName.value, "capitalCase").value
  })

  return {
    name,
    tours,
    paramName,
    tournamentName,
    ids
  }
})
