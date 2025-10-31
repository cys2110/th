export function useViewMode() {
  const viewMode = useState<"cards" | "table">("viewMode", () => {
    if (process.server) {
      const cookie = useCookie<"cards" | "table">("viewMode")
      return cookie.value || "cards"
    }

    return "cards"
  })

  const setViewMode = (mode: "cards" | "table") => {
    viewMode.value = mode
    const cookie = useCookie<"cards" | "table">("viewMode")
    cookie.value = mode
  }

  return { viewMode, setViewMode }
}
