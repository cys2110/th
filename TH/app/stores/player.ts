type OptionType = {
  value: string
  label: string
}

const currentYear = new Date().getFullYear()

export const usePlayerStore = defineStore("player", () => {
  const firstName = ref("")
  const lastName = ref("")
  const paramName = ref("")

  const tour = ref<TourType | null>()

  const activeYears = ref<number[]>([])

  const active = computed(() => activeYears.value.includes(currentYear))

  const fullName = computed(() => {
    if (firstName.value && lastName.value) {
      return `${firstName.value} ${lastName.value}`
    } else {
      return startCase(paramName.value)
    }
  })

  return {
    firstName,
    lastName,
    paramName,
    fullName,
    tour,
    activeYears,
    active
  }
})
