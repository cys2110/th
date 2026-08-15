import { defineStore } from "pinia"

export const useViewModeStore = defineStore("viewMode", () => {
  const isTableView = useCookie<boolean>("is-table-view", {
    default: () => true
  })

  const toggleViewMode = () => {
    isTableView.value = !isTableView.value
  }

  return { isTableView, toggleViewMode }
})
