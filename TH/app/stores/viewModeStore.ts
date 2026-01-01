/** View mode store */

export const useViewModeStore = defineStore("viewMode", () => {
  const isCardView = ref(true)

  const toggleViewMode = () => set(isCardView, !isCardView.value)

  return { isCardView, toggleViewMode }
})
