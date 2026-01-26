<script setup lang="ts">
import type { PageAnchor } from "@nuxt/ui"

definePageMeta({ name: "player" })

const {
  params: { id, name }
} = useRoute("player")

const {
  ui: { icons }
} = useAppConfig()
const { devMode } = useRuntimeConfig().public
const toast = useToast()

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smallerOrEqual("lg")

const playerStore = usePlayerStore()

const pageAnchors: PageAnchor[] = [
  { label: "Details", icon: ICONS.cards, to: "#details" },
  { label: "Win-Loss", icon: ICONS.stats, to: "#wl" },
  { label: "Most Frequent H2H", icon: ICONS.h2h, to: "#h2h" },
  { label: "Recent Events", icon: ICONS.years, to: "#recent-events" }
]

// API call
const { data, status, error } = await useFetch("/api/player", {
  query: { id },
  default: () => ({ statusObjects: [], results: {} as PlayerDetailsType })
})

watch(
  () => data.value.statusObjects,
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

const isScraping = ref(false)

const scrapeEnabled = computed(() => {
  const singlesChDate = data.value?.results.singles_ch_date ? new Date(data.value?.results.singles_ch_date) : null
  const doublesChDate = data.value?.results.doubles_ch_date ? new Date(data.value?.results.doubles_ch_date) : null
  const cutoffDate = new Date("2001-01-01")
  if (
    (singlesChDate && singlesChDate < cutoffDate) ||
    (doublesChDate && doublesChDate < cutoffDate) ||
    (data.value?.results.retired && data.value.results.retired < 2024) ||
    data.value?.results.dod
  ) {
    return false
  }
  return true
})

const handleScrape = async () => {
  set(isScraping, true)

  const apiSlug = isNaN(Number(id)) ? "atp_player" : "wta_player"

  await $fetch(`${FLASK_ROUTE}/${apiSlug}/` + id, {
    method: "GET",
    timeout: 120_000
  })
    .then(() => {
      toast.add({
        title: `${startCase(name)} scraped`,
        icon: icons.success,
        color: "success"
      })

      reloadNuxtApp()
    })
    .catch(e => {
      console.error(e)
      toast.add({
        title: `Error scraping ${startCase(name)}`,
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isScraping, false)
    })
}
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-badge
            v-if="data?.results?.updated_at"
            :label="`Updated: ${(lgAndDown ? shortDateFormat : dateTimeFormat).format(new Date(data.results.updated_at))}`"
            color="success"
            class="w-full"
          />

          <dev-only>
            <client-only>
              <u-button
                v-if="scrapeEnabled"
                :label="`Scrape ${playerStore.fullName}`"
                color="warning"
                block
                :icon="isScraping ? ICONS.downloading : ICONS.download"
                @click="handleScrape"
              />
            </client-only>

            <player-update
              v-if="data.results"
              :player="data.results"
            />

            <u-separator />
          </dev-only>

          <u-page-anchors :links="pageAnchors" />
        </u-page-aside>
      </template>

      <player-wrapper />

      <u-page-body>
        <api-alerts :error />

        <player-details
          v-if="data.results"
          :player="data.results"
        />

        <loading-details v-else-if="status === 'pending'" />

        <empty
          v-else
          :message="`No details available about ${playerStore.fullName}`"
          :icon="ICONS.peopleOff"
        />

        <player-wl-table />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <player-h2h-table />

          <player-recent-events />
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
