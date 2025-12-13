<script setup lang="ts">
const {
  name: routeName,
  params: { id, name }
} = useRoute("player")
const {
  ui: { icons, colors }
} = useAppConfig()
const router = useRouter()

const playerPages = [
  { label: "Overview", value: "player", icon: ICONS.profile },
  { label: "Activity", value: "activity", icon: ICONS.event },
  { label: "Titles and Finals", value: "titles-and-finals", icon: ICONS.one },
  { label: "Win-Loss Index", value: "wl-index", icon: ICONS.barChart },
  { label: "Stats", value: "stats", icon: ICONS.stats },
  { label: "Record", value: "record", icon: ICONS.tournament }
]

const currentPage = computed(() => playerPages.find(page => page.value === routeName))

const { data: player } = await useFetch("/api/players/overview", {
  key: id,
  query: { id }
})

useHead({
  title: () =>
    `${currentPage.value?.label} | ${player.value?.first_name ? `${player.value.first_name} ${player.value.last_name}` : capitalCase(name)}`
})

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

const playerName = useState("playerName", () =>
  player.value?.first_name ? `${player.value.first_name} ${player.value.last_name}` : capitalCase(name)
)
const playerTour = useState("playerTour", () => player.value?.tour || "ATP")
const playerYears = useState("playerYears", () => player.value?.years || [])

const activeRoute = computed({
  get() {
    return routeName
  },
  set(tab) {
    router.push({ name: tab, params: { name, id } })
  }
})
</script>

<template>
  <u-page-header
    :title="playerName"
    class="border-none mb-0"
  >
    <template #headline>
      <breadcrumbs />
    </template>

    <template #description>
      <div
        v-if="player"
        class="flex items-center gap-2 w-fit mb-2"
      >
        <countries-link
          v-if="player?.country?.id"
          :country="player.country"
          icon-only
        />

        <u-badge
          :color="activeYears.active ? 'Active' : 'Inactive'"
          :label="activeYears.active ? 'Active' : 'Inactive'"
        />

        <u-badge
          :color="(player.tour as keyof typeof colors)"
          :label="player.tour"
        />

        <div>
          Years Active: {{ activeYears.activeYears }} ({{ activeYears.numberOfYears }} year{{ activeYears.numberOfYears === 1 ? "" : "s" }})
        </div>
      </div>
      <u-tabs
        v-model="activeRoute"
        :content="false"
        :items="playerPages"
        variant="link"
      />
    </template>

    <template #links>
      <slot name="header-links" />
      <u-button
        v-if="player?.site_link"
        :href="player.site_link"
        :icon="icons.external"
        target="_blank"
      />
      <u-button
        v-if="player?.official_link"
        :href="player.official_link"
        :icon="ICONS.player"
        target="_blank"
      />
      <u-button
        v-if="player?.wiki_link"
        :href="player.wiki_link"
        :icon="ICONS.wikipedia"
        target="_blank"
      />
    </template>
  </u-page-header>
</template>
