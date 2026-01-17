<script setup lang="ts">
const {
  name: routeName,
  params: { id, name }
} = useRoute("player")
const {
  ui: { icons }
} = useAppConfig()
const router = useRouter()
const playerStore = usePlayerStore()

watchOnce(
  () => name,
  newName => {
    playerStore.paramName = newName as string
  },
  { immediate: true }
)

const playerPages = [
  { label: "Overview", value: "player", icon: ICONS.profile },
  { label: "Activity", value: "activity", icon: ICONS.years },
  { label: "Titles and Finals", value: "titles-and-finals", icon: ICONS.one },
  { label: "Win-Loss Index", value: "wl-index", icon: ICONS.barChart },
  { label: "Stats", value: "stats", icon: ICONS.stats },
  { label: "Record", value: "record", icon: ICONS.trophy }
]
const currentYear = new Date().getFullYear()

const currentPage = computed(() => playerPages.find(page => page.value === routeName))

const activeRoute = computed({
  get() {
    return routeName
  },
  set(tab) {
    router.push({ name: tab, params: { name, id } })
  }
})

// Set browser tab name here to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => playerStore.fullName
  }
})

const { data: player, error } = await useFetch("/api/player/overview", {
  query: { id }
})

watch(
  player,
  () => {
    if (player.value) {
      if (player.value.first_name) playerStore.firstName = player.value.first_name
      if (player.value.last_name) playerStore.lastName = player.value.last_name
      playerStore.tour = player.value.tour as "ATP" | "WTA"

      if (player.value.years) {
        playerStore.activeYears = player.value.years
        if (player.value.years.includes(currentYear)) {
          playerStore.active = "Active"
        }
      }
    }
  },
  { immediate: true }
)

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

watch(
  player,
  () => {
    if (player.value) {
      if (player.value.first_name) playerStore.firstName = player.value.first_name
      if (player.value.last_name) playerStore.lastName = player.value.last_name
    }
  },
  { immediate: true }
)

const years = computed(() => {
  let activeYears = ""
  let numberOfYears = 0

  if (player.value?.years?.length) {
    const lastYear = player.value.years[player.value.years.length - 1]
    numberOfYears = lastYear! - player.value.years[0]! + 1
    activeYears = `${player.value.years[0]}${
      player.value.years.length > 1 ? ` — ${playerStore.active === "Active" ? "present" : player.value.years[player.value.years.length - 1]}` : ""
    }`
  }

  return { activeYears, numberOfYears }
})
</script>

<template>
  <u-page-header
    headline="Players"
    :title="playerStore.fullName"
    :ui="{
      root: 'border-none mb-0',
      description: 'text-md w-fit flex items-center gap-2'
    }"
  >
    <template
      #description
      v-if="player"
    >
      <country-link
        v-if="player?.country?.id"
        :country="player.country"
        icon-only
      />

      <u-chip :color="playerStore.active">
        <u-badge
          :color="playerStore.tour"
          :label="playerStore.tour"
        />
      </u-chip>

      <div> Years Active: {{ years.activeYears }} ({{ years.numberOfYears }} year{{ years.numberOfYears === 1 ? "" : "s" }}) </div>
    </template>

    <template #default>
      <u-tabs
        v-model="activeRoute"
        :content="false"
        :items="playerPages"
        variant="link"
        :ui="{ list: 'justify-end' }"
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
