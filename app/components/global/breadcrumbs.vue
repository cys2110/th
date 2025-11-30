<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const { name, params } = useRoute()

const apiRoute = computed(() => {
  switch (name) {
    case "player":
    case "activity":
    case "titles-and-finals":
    case "wl-index":
    case "stats":
    case "record":
      return `/api/players/overview?id=${params.id}`
    case "tournament":
    case "edition":
    case "event":
      return `/api/tournaments?id=${params.id}`
    case "match":
      return `/api/matches/overview?mid=${params.mid}&edId=${params.edId}&tour=${params.tour}`
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
      crumbs.push(
        { label: "Players", icon: ICONS.player, to: { name: "players" } },
        {
          label: data.value?.first_name ? `${data.value.first_name} ${data.value.last_name}` : capitalCase(params.name),
          to: { name: "player", params: { name: params.name, id: params.id } }
        }
      )
      break
    case "tournament":
    case "edition":
    case "event":
    case "results":
    case "draws":
    case "match":
      crumbs.push(
        { label: "Tournaments", icon: ICONS.tournament, to: { name: "tournaments" } },
        { label: data.value?.name || capitalCase(params.name), to: { name: "tournament", params: { name: params.name, id: params.id } } }
      )

      if (name === "event" || name === "results" || name === "draws" || name === "match") {
        crumbs.push(
          {
            label: params.year,
            to: {
              name: "edition",
              params: { name: params.name, id: params.id, year: params.year, edId: params.edId }
            }
          },
          {
            label: params.tour,
            to: { name: "event", params: { name: params.name, id: params.id, year: params.year, edId: params.edId, tour: params.tour } }
          }
        )

        if (name === "match") {
          const { draw, type } = destructureMid(params.mid as string)

          crumbs.push({ label: type }, { label: draw }, { label: data.value?.round ?? "Loading" })
        }
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
