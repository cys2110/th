import { useStorage } from "@vueuse/core"

const isTableView = useLocalStorage("isTableView", true)

export const useViewModeStore = defineStore("viewMode", () => {
  const toggleViewMode = () => {
    set(isTableView, !isTableView.value)
    useStorage("isTableView", isTableView.value)
  }

  return { isTableView, toggleViewMode }
})
