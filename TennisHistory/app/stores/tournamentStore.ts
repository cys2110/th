export const useTournamentStore = defineStore("tournament", () => {
  const name = ref("")
  const tours = ref<(keyof typeof tourEnum)[]>([])
  const id = ref("")
  const edId = ref("")

  return {
    name,
    tours,
    id,
    edId
  }
})
