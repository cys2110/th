type OptionType = {
  value: string | number
  label: string
}

export const useArchiveStore = defineStore("archive", () => {
  const filters = ref<{ tournaments: Array<OptionType>; venues: Array<OptionType> }>({
    tournaments: [],
    venues: []
  })

  return {
    filters
  }
})
