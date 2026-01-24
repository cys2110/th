<script setup lang="ts">
import type { PageAnchor } from "@nuxt/ui"

definePageMeta({ name: "player" })

const {
  params: { id }
} = useRoute("player")
const {
  ui: { icons }
} = useAppConfig()
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
const {
  data: player,
  status,
  error
} = await useFetch("/api/player", {
  query: { id }
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage) {
        console.error(error.value.statusMessage, error.value.data?.data)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

const isScraping = ref(false)

const scrapeEnabled = computed(() => {
  const singlesChDate = player.value?.singles_ch_date ? new Date(player.value?.singles_ch_date) : null
  const doublesChDate = player.value?.doubles_ch_date ? new Date(player.value?.doubles_ch_date) : null
  const cutoffDate = new Date("2001-01-01")
  if (
    (singlesChDate && singlesChDate < cutoffDate) ||
    (doublesChDate && doublesChDate < cutoffDate) ||
    (player.value?.retired && player.value.retired < 2024) ||
    player.value?.dod
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
        title: `${id} scraped`,
        icon: icons.success,
        color: "success"
      })

      reloadNuxtApp()
    })
    .catch(e => {
      console.error(e)
      toast.add({
        title: `Error updating ${id}`,
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
            v-if="player?.updated_at"
            :label="`Updated: ${(lgAndDown ? shortDateFormat : dateTimeFormat).format(new Date(player.updated_at))}`"
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
              v-if="player"
              :player
            />

            <u-separator />
          </dev-only>

          <u-page-anchors :links="pageAnchors" />
        </u-page-aside>
      </template>

      <player-wrapper />

      <u-page>
        <u-page-body>
          <player-details
            v-if="player && status === 'success'"
            :player
          />

          <loading-details v-else-if="status === 'pending'" />

          <empty
            v-else
            :message="`No details available about ${playerStore.fullName}`"
          />

          <player-wl-table />

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <player-h2h-table />

            <player-recent-events />
          </div>
        </u-page-body>
      </u-page>
    </u-page>
  </u-container>
</template>
