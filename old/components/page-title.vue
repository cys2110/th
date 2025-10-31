<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()
const { name: routeName, params } = useRoute()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndUp = breakpoints.greaterOrEqual("md")

const apiRoute = computed(() => {
  switch (routeName) {
    case "country":
      return {
        route: `/api/countries/overview?id=${id}`,
        key: `country-overview-${id}`
      }
    case "head-to-head":
      return {
        route: `/api/h2h/players?p1Id=${p1Id}&p2Id=${p2Id}`,
        key: `h2h-players-${p1Id}-${p2Id}`
      }
    default:
      return {
        route: "",
        key: ""
      }
  }
})

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const crumbs: BreadcrumbItem[] = [{ label: "Home", icon: ICONS.home, to: { name: "home" } }]

  switch (routeName) {
    case "about":
      crumbs.push({ label: "About", icon: icons.info, to: { name: "about" } })
      break
    case "countries":
      crumbs.push({ label: "Countries", icon: ICONS.countries, to: { name: "countries" } })
      break
    case "country":
      return [
        ...crumbs,
        { label: "Countries", icon: ICONS.countries, to: { name: "countries" } },
        ...(routeName === "country" ? [{ label: data.value?.name || capitalCase(name as string), icon: getFlagCode(data.value) }] : [])
      ]
    case "h2h":
    case "head-to-head":
      return [
        ...crumbs,
        { label: "H2H", icon: ICONS.h2h, to: { name: "h2h" } },
        ...(routeName === "head-to-head"
          ? [
              {
                label: `${data.value ? `${data.value.p1.first_name} ${data.value.p1.last_name}` : capitalCase(p1Name as string)} v ${
                  data.value ? `${data.value.p2.first_name} ${data.value.p2.last_name}` : capitalCase(p2Name as string)
                }`
              }
            ]
          : [])
      ]
    case "results-archive":
      crumbs.push({ label: "Results Archive", icon: ICONS.event, to: { name: "results-archive" } })
      break
    // case "statistics-and-records":
    //   return [...crumbs, { label: "Statistics and Records", icon: icons.stats, to: { name: "statistics-and-records" } }]
    case "years":
      return [
        ...crumbs,
        { label: "Years", icon: ICONS.year, to: { name: "years" } },
        ...(query.year ? [{ label: query.year as string }] : [{ label: new Date().getFullYear() }])
      ] as BreadcrumbItem[]
    default:
      break
  }

  return crumbs
})

const pageTitle = computed(() => {
  switch (routeName) {
    case "head-to-head":
      return data.value
        ? `${data.value.p1.first_name} ${data.value.p1.last_name} v ${data.value.p2.first_name} ${data.value.p2.last_name}`
        : `${capitalCase(p1Name as string)} v ${capitalCase(p2Name as string)}`
    default:
      return `${capitalCase(routeName)}`
  }
})
</script>

<template>
  <u-breadcrumb
    v-if="mdAndUp"
    :items="breadcrumbs"
  />
  <div
    v-else
    class="font-semibold text-muted text-wrap text-sm"
  >
    <country-link
      v-if="data && routeName === 'country'"
      :country="data"
      :icon-only="false"
      class="mx-auto"
    />
  </div>
</template>
