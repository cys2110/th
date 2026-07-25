import type { LocationQueryValueRaw } from "vue-router"

export const useRouteQueryUpdater = () => {
  const route = useRoute()
  const router = useRouter()

  return (key: string, value: LocationQueryValueRaw | LocationQueryValueRaw[]) => {
    const { [key]: _removed, ...query } = route.query
    const hasValue = Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== ""

    return router.replace({
      query: hasValue ? { ...query, [key]: value } : query
    })
  }
}
