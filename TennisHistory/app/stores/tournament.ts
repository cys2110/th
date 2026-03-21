type OptionType = {
  value: number
  label: string
}

export const useTournamentStore = defineStore("tournament", () => {
  const paramName = ref("")
  const tournamentName = ref("")

  const tours = ref<Array<TourType>>([])

  const id = ref("")
  const edId = ref("")

  const name = computed(() => {
    if (tournamentName.value) return tournamentName.value

    return startCase(paramName.value)
  })

  return {
    name,
    tours,
    id,
    edId,
    paramName,
    tournamentName
  }
})
