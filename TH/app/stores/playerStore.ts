/** Player store */

export const usePlayerStore = defineStore("player", () => {
  const firstName = ref("")
  const lastName = ref("")
  const paramName = ref("")

  const tour = ref<"ATP" | "WTA">()

  const active = ref<"Active" | "Inactive">("Inactive")
  const activeYears = ref<number[]>([])

  const fullName = computed(() => {
    if (firstName.value && lastName.value) {
      return `${get(firstName)} ${get(lastName)}`
    } else {
      return startCase(get(paramName))
    }
  })

  return {
    firstName,
    lastName,
    paramName,
    fullName,
    tour,
    active,
    activeYears
  }
})
