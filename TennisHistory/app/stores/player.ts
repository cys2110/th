export const usePlayerStore = defineStore("player", () => {
  const playerName = ref("")
  const paramName = ref("")

  const tour = ref<TourType>()

  const activeYears = ref<number[]>([])
  const isActive = ref(false)

  const fullName = computed(() => {
    if (playerName.value) {
      return playerName.value
    } else {
      return startCase(paramName.value)
    }
  })

  return {
    playerName,
    paramName,
    fullName,
    tour,
    activeYears,
    isActive
  }
})
