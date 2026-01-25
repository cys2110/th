export const useViewModeStore = defineStore("viewMode", () => {
  const isCardView = useLocalStorage("isCardView", true)

  const toggleViewMode = () => {
    set(isCardView, !isCardView.value)
  }

  return { isCardView, toggleViewMode }
})
