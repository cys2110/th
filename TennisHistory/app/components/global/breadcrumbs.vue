<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const { name, params, query } = useRoute()

const apiRoute = computed(() => {
  switch (name) {
    case "tournament":
    case "edition":
    case "results":
    case "draws":
      return `/api/tournaments?id=${params.id}`
    case "match":
      return `/api/matches/overview?matchNo=${query.match_no}&edId=${params.edId}&tour=${query.tour}&draw=${query.draw}&type=${query.type}`
    default:
      return ""
  }
})

const { data } = await useFetch<any>(apiRoute.value)

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const crumbs: BreadcrumbItem[] = [{ icon: ICONS.home, to: { name: "home" } }]

  switch (name) {
    case "country":
      crumbs.push({ label: "Countries", icon: ICONS.countries, to: { name: "countries" } })
      break
    case "head-to-head":
      crumbs.push({ label: "Head to Head", icon: ICONS.h2h, to: { name: "h2h" } })
      break
    case "player":
    case "activity":
    case "stats":
    case "titles-and-finals":
    case "record":
    case "wl-index":
      crumbs.push({ label: "Players", icon: ICONS.player, to: { name: "players" } })
      break
    case "match":
      crumbs.push(
        { label: "Tournaments", icon: ICONS.tournament, to: { name: "tournaments" } },
        { label: data.value?.name || capitalCase(params.name), to: { name: "tournament", params: { name: params.name, id: params.id } } }
      )

      if (name === "match") {
        crumbs.push(
          {
            label: params.year,
            to: {
              name: "edition",
              params: { name: params.name, id: params.id, year: params.year, edId: params.edId }
            }
          },
          { label: query.tour as string },
          { label: query.type as string },
          { label: query.draw as string },
          { label: data.value?.round ?? "Loading" }
        )
      }
      break
    case "years":
      crumbs.push({ label: "Years", icon: ICONS.year, to: { name: "years" } })
      break
    default:
      break
  }

  return crumbs
})
</script>

<template>
  <u-breadcrumb :items="breadcrumbs" />
</template>
