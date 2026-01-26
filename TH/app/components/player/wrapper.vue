<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

const route = useRoute("player")
const router = useRouter()

const {
  ui: { icons }
} = useAppConfig()
const { devMode } = useRuntimeConfig().public

const playerStore = usePlayerStore()

watch(
  () => route.params.name,
  newName => {
    playerStore.paramName = newName as string
  },
  { immediate: true }
)

const playerPages: TabsItem[] = [
  { label: "Overview", value: "player", icon: ICONS.profile },
  { label: "Activity", value: "activity", icon: ICONS.racquet },
  { label: "Titles and Finals", value: "titles-and-finals", icon: ICONS.one },
  { label: "Win-Loss Index", value: "wl-index", icon: ICONS.barChart },
  { label: "Stats", value: "stats", icon: ICONS.stats },
  { label: "Record", value: "record", icon: ICONS.trophy }
]

const currentYear = new Date().getFullYear()

const currentPage = computed(() => playerPages.find(page => page.value === route.name))

const activeRoute = computed({
  get() {
    return route.name
  },
  set(tab) {
    router.push({ name: tab, params: { name: route.params.name, id: route.params.id } })
  }
})

// Set browser tab name here to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => playerStore.fullName
  }
})

const { data, error } = await useFetch("/api/player/overview", {
  query: { id: route.params.id }
})

watch(
  () => data.value?.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info(`${playerStore.fullName} API Status Objects:`, data.value.statusObjects)
    }
  },
  { immediate: true }
)

watch(
  error,
  newError => {
    if (newError) {
      if (newError.statusMessage) {
        console.error(newError.statusMessage, newError.data?.data)
      } else {
        console.error(newError)
      }
    }
  },
  { immediate: true }
)

watch(
  () => data.value?.results,
  () => {
    if (data.value?.results) {
      if (data.value.results.first_name) playerStore.firstName = data.value.results.first_name
      if (data.value.results.last_name) playerStore.lastName = data.value.results.last_name
      playerStore.tour = data.value.results.tour as "ATP" | "WTA"

      playerStore.activeYears = data.value.results.years
      if (data.value.results.years.includes(currentYear)) {
        playerStore.active = "Active"
      }
    } else {
      playerStore.firstName = ""
      playerStore.lastName = ""
      playerStore.tour = undefined
      playerStore.activeYears = []
    }
  },
  { immediate: true }
)

const years = computed(() => {
  let activeYears = ""
  let numberOfYears = 0

  if (data.value?.results.years?.length) {
    const lastYear = data.value.results.years[data.value.results.years.length - 1]
    numberOfYears = lastYear! - data.value.results.years[0]! + 1
    activeYears = `${data.value.results.years[0]}${
      data.value.results.years.length > 1 ?
        ` — ${playerStore.active === "Active" ? "present" : data.value.results.years[data.value.results.years.length - 1]}`
      : ""
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
      v-if="data?.results"
    >
      <country-link
        v-if="data.results.country?.id"
        :country="data.results.country"
        icon-only
      />

      <u-chip :color="playerStore.active">
        <u-badge
          :label="playerStore.tour"
          :color="playerStore.tour"
        />
      </u-chip>

      <div> Years Active: {{ years.activeYears }} ({{ years.numberOfYears }} year{{ years.numberOfYears === 1 ? "" : "s" }}) </div>
    </template>

    <template #default>
      <u-tabs
        :items="playerPages"
        variant="link"
        :content="false"
        v-model="activeRoute"
        :ui="{ list: 'justify-end' }"
      />
    </template>

    <template #links>
      <u-button
        v-if="data?.results.site_link"
        :icon="icons.external"
        :href="data?.results.site_link"
        target="_blank"
      />

      <u-button
        v-if="data?.results.official_link"
        :icon="ICONS.player"
        :href="data?.results.official_link"
        target="_blank"
      />

      <u-button
        v-if="data?.results.wiki_link"
        :icon="ICONS.wikipedia"
        :href="data?.results.wiki_link"
        target="_blank"
      />

      <slot name="header-links" />
    </template>
  </u-page-header>
</template>
