import { useStorage } from "@vueuse/core"

export const useViewModeStore = defineStore("viewMode", () => {
  const isTableView = useLocalStorage("isTableView", true)

  const toggleViewMode = () => {
    set(isTableView, !isTableView.value)
    useStorage("isTableView", isTableView.value)
  }

  return { isTableView, toggleViewMode }
})
