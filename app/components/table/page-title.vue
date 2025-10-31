<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const { name, params, query } = useRoute() as any
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndUp = breakpoints.greaterOrEqual("md")
const {
  ui: { icons }
} = useAppConfig()

const apiRoute = computed(() => {
  switch (name) {
    case "player":
    case "activity":
    case "titles-and-finals":
    case "wl-index":
    case "stats":
    case "record":
      return {
        route: `/api/players/overview?id=${params.id}`,
        key: `player-overview-${params.id}`
      }
    case "tournament":
    case "edition":
    case "event":
    case "results":
    case "draws":
      return {
        route: `/api/tournaments/overview?id=${params.id}`,
        key: `tournament-overview-${params.id}`
      }
    case "match":
      return {
        route: `/api/matches/overview?edId=${params.edId}&tour=${params.tour}&mid=${params.mid}`,
        key: `match-overview-${params.edId}-${params.tour}-${params.mid}`
      }
    default:
      return {
        route: "",
        key: ""
      }
  }
})

const { data } = await useFetch<any>(() => get(apiRoute).route, {
  key: get(apiRoute).key
})

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const crumbs: BreadcrumbItem[] = [{ label: "Home", icon: ICONS.home, to: { name: "home" } }]

  switch (name) {
    case "players":
    case "player":
    case "activity":
    case "titles-and-finals":
    case "wl-index":
    case "stats":
    case "record":
      crumbs.push({ label: "Players", icon: ICONS.player, to: { name: "players" } })
      if (name !== "players") {
        const currentPage = PLAYER_PAGES.find(page => page.name === name)
        crumbs.push(
          {
            label: data.value.first_name ? `${data.value.first_name} ${data.value.last_name}` : capitalCase(params.name),
            to: { name: "player", params: { id: params.id, name: params.name } }
          },
          {
            label: currentPage?.label || capitalCase(name as string),
            icon: currentPage?.icon
          }
        )
      }
      break
    case "tournaments":
    case "tournament":
    case "edition":
    case "event":
    case "results":
    case "draws":
    case "match":
      crumbs.push({ label: "Tournaments", icon: ICONS.tournament, to: { name: "tournaments" } })

      if (name !== "tournaments") {
        crumbs.push({
          label: get(data)?.name || capitalCase(params.name),
          to: { name: "tournament", params: { id: params.id, name: params.name } }
        })
      }

      if (!["tournaments", "tournament"].includes(name)) {
        crumbs.push({
          label: params.year as string,
          to: { name: "edition", params: { id: params.id, name: params.name, year: params.year, edId: params.edId } }
        })
      }

      if (["event", "results", "draws"].includes(name)) {
        const eventPage = EVENT_PAGES.find(page => page.name === name)

        crumbs.push(
          {
            label: params.tour,
            to: { name: name, params: { id: params.id, name: params.name, year: params.year, edId: params.edId, tour: params.tour } }
          },
          {
            label: eventPage?.label || "",
            icon: eventPage?.icon,
            ui: { linkLeadingIcon: name === "draws" ? "rotate-270" : undefined }
          }
        )
      } else if (name === "match") {
        const { type } = destructureMid(params.mid)
        crumbs.push(
          {
            label: type
          },
          {
            label: data.value?.round ?? "Loading..."
          },
          {
            label: data.value ? `${data.value.player1} v ${data.value.player2}` : "Loading..."
          }
        )
      }
      break
    default:
      break
  }

  return crumbs
})

const pageTitle = computed(() => {
  switch (name) {
    case "h2h":
      return "Head to Head"
    case "years":
      return `Years - ${query.year ?? new Date().getFullYear()}`
    default:
      return capitalCase(name)
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
    <div v-if="['tournament', 'edition'].includes(name)">
      <div>{{ data.name ?? capitalCase(name) }}{{ name === "edition" ? ` ${params.year}` : "" }}</div>
      <div v-if="name === 'tournament'">
        <span v-if="data.established">{{ data.established }}</span>
        <span v-if="data.established && !data.abolished"> - present</span>
        <span v-else-if="data.abolished && data.established !== data.abolished"> - {{ data.abolished }}</span>
      </div>
    </div>
    <div v-else-if="['event', 'results', 'draws'].includes(name as string)">
      <div>{{ EVENT_PAGES.find(page => page.name === name)?.label }}</div>
      <div class="truncate">{{ data.value?.name || capitalCase(params.name) }} {{ params.year }}</div>
    </div>
    <div v-else-if="name === 'match'">
      <div>{{ data ? `${data.player1} vs ${data.player2}` : `${capitalCase(params.name as string)} ${params.year}` }}</div>
      <div>{{
        data
          ? `${data.name} ${params.year}`
          : `${TourEnum[params.tour as keyof typeof TourEnum]} ${destructureMid(params.mid).type} ${destructureMid(params.mid).draw} ${
              destructureMid(params.mid).match_no
            }`
      }}</div>
    </div>
    <div v-else-if="['player', 'activity', 'titles-and-finals', 'wl-index', 'stats', 'record'].includes(name)">
      <div>{{ PLAYER_PAGES.find(page => page.name === name)?.label }}</div>
      <div class="truncate">{{ data ? `${data.first_name} ${data.last_name}` : params && "name" in params ? capitalCase(params.name) : "" }}</div>
    </div>
    <template>{{ pageTitle }}</template>
  </div>
</template>
