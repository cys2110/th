<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem } from "@nuxt/ui"

const {
  name: routeName,
  params: { id, name }
} = useRoute("player")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const scraping = ref(false)

defineShortcuts({
  meta_shift_s: () => handleScrape()
})

const { data: player } = await useFetch<PlayerInterface>("/api/players/overview", {
  key: `player-overview-${id}`,
  query: { id }
})

const playerYears = useState<number[]>("playerYears", () => player.value?.years ?? [])
const playerName = useState<string>("playerName", () => (player.value?.first_name ? `${player.value.first_name} ${player.value.last_name}` : ""))
const playerTour = useState<TourEnum | string>("playerTour", () => player.value?.tour || "")

const currentPage = computed(() => PLAYER_PAGES.find(page => page.name === routeName) || null)

useHead({
  title: () =>
    `${currentPage.value?.label} | ${player.value?.first_name ? `${player.value.first_name} ${player.value.last_name}` : capitalCase(name)}`
})

const otherLinks = computed(() => {
  if (player.value) {
    const playerDetails = player.value
    return [
      { label: "Site Profile", to: player.value.site_link, target: "_blank" },
      playerDetails.official_link && { label: "Official Website", to: playerDetails.official_link, target: "_blank" },
      playerDetails.wiki_link && { label: "Wikipedia", to: playerDetails.wiki_link, target: "_blank" }
    ].filter(Boolean) as DropdownMenuItem[]
  }
  return []
})

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { icon: ICONS.home, to: { name: "home" } },
  { label: "Players", to: { name: "players" }, icon: ICONS.player },
  {
    label: player.value?.first_name ? `${player.value.first_name} ${player.value.last_name}` : capitalCase(name),
    to: { name: "player", params: { name, id } }
  }
])

// Determine whether player is still active on tour
const activeYears = computed(() => {
  let active = false
  let numberOfYears = 0
  let activeYears = ""
  if (player.value?.years?.length) {
    const lastYear = player.value.years[player.value.years.length - 1]
    active = lastYear === new Date().getFullYear()
    numberOfYears = lastYear! - player.value.years[0]! + 1
    activeYears = `${player.value.years[0]}${
      player.value.years.length > 1 ? ` — ${active ? "present" : player.value.years[player.value.years.length - 1]}` : ""
    }`
  }
  return { active, numberOfYears, activeYears }
})

const scrapeEnabled = computed(() => {
  const singlesChDate = player.value?.singles_ch_date ? new Date(player.value?.singles_ch_date) : null
  const doublesChDate = player.value?.doubles_ch_date ? new Date(player.value?.doubles_ch_date) : null
  const cutoffDate = new Date("2001-01-01")
  if ((singlesChDate && singlesChDate < cutoffDate) || (doublesChDate && doublesChDate < cutoffDate) || player.value?.dod) {
    return false
  }
  return true
})

const handleScrape = async () => {
  set(scraping, true)
  try {
    const apiSlug = isNaN(Number(id)) ? "atp_player" : "wta_player"
    const response = await $fetch(`${FLASK_ROUTE}/${apiSlug}/` + id, {
      method: "GET",
      timeout: 120_000
    })
    if ((response as any).ok) {
      toast.add({
        title: "Player updated",
        icon: icons.success,
        color: "success"
      })
    } else {
      toast.add({
        title: "Error updating player",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)
    toast.add({
      title: "Error updating player",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(scraping, false)
    reloadNuxtApp()
  }
}
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-badge
            v-if="player?.updated_at"
            class="w-full justify-center"
            :label="`Updated at: ${get(useDateFormat(player.updated_at, 'DD MMMM YYYY'))}`"
            color="success"
          />
          <dev-only v-if="routeName === 'player'">
            <players-update
              v-if="player"
              :player
            />
            <u-button
              v-if="scrapeEnabled"
              label="Scrape player"
              @click="handleScrape"
              block
              :icon="scraping ? ICONS.downloading : ICONS.download"
            />
          </dev-only>
          <slot name="page-left" />
        </u-page-aside>
      </template>

      <template
        #right
        v-if="$slots['page-right']"
      >
        <u-page-aside>
          <slot name="page-right" />
        </u-page-aside>
      </template>

      <u-page-header :title="currentPage?.label">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #description>
          <div
            v-if="player"
            class="flex items-center gap-2 w-fit"
          >
            <countries-link
              v-if="player?.country?.id"
              :country="player?.country"
              icon-only
            />
            <u-badge
              :color="activeYears.active ? 'Active' : 'Inactive'"
              :label="activeYears.active ? 'Active' : 'Inactive'"
            />
            <u-badge
              :color="player.tour"
              :label="TourEnum[player.tour]"
            />
            <div>
              Years Active: {{ activeYears.activeYears }} ({{ activeYears.numberOfYears }} year{{ activeYears.numberOfYears === 1 ? "" : "s" }})
            </div>
          </div>
        </template>

        <template #links>
          <u-dropdown-menu :items="otherLinks">
            <u-button :icon="icons.external" />
          </u-dropdown-menu>
          <u-dropdown-menu :items="PLAYER_PAGES.map(page => ({ ...page, to: { name: page.name, params: { name, id}}}) as DropdownMenuItem)">
            <u-button :icon="ICONS.layers" />
          </u-dropdown-menu>
        </template>
      </u-page-header>

      <u-page-body>
        <slot :active-years="activeYears" />
      </u-page-body>
    </u-page>
  </u-container>
</template>
