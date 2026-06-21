export const useTournamentStore = defineStore("tournament", () => {
  const paramName = ref("")
  const tournamentName = ref("")

  const tours = ref<Array<TourType>>([])

  const name = computed(() => {
    if (tournamentName.value) return tournamentName.value

    return startCase(paramName.value)
  })

  return {
    name,
    tours,
    paramName,
    tournamentName
  }
})
