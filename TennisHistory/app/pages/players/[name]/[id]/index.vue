<script setup lang="ts">
definePageMeta({ name: "player" })

const {
  params: { id }
} = useRoute("player")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const playerStore = usePlayerStore()

// API call
const { data: player, status } = await useFetch("/api/player", {
  query: { id },
  onResponseError: ({ error }) => console.error(error)
})

const scraping = ref(false)

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
  set(scraping, true)
  try {
    const apiSlug = isNaN(Number(id)) ? "atp_player" : "wta_player"

    const response = await $fetch(`${FLASK_ROUTE}/${apiSlug}/` + id, {
      method: "GET",
      timeout: 120_000
    })
    if ((response as any).success) {
      toast.add({
        title: `${id} updated`,
        icon: icons.success,
        color: "success"
      })
    } else {
      toast.add({
        title: `Error updating ${id}`,
        icon: icons.error,
        color: "error"
      })
    }
    reloadNuxtApp() // Must reload rather than just refetch in order to update the wrapper
  } catch (e) {
    console.error(e)
    toast.add({
      title: `Error updating ${id}`,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(scraping, false)
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
            class="w-full"
            :label="`Updated on ${useDateFormat(player.updated_at as string, 'DD MMMM YYYY').value}`"
            color="success"
          />

          <dev-only>
            <u-separator />

            <u-button
              v-if="scrapeEnabled"
              label="Scrape player"
              @click="handleScrape"
              block
              :icon="scraping ? ICONS.downloading : ICONS.download"
              color="Doubles"
            />

            <players-update
              v-if="player"
              :player
            />
          </dev-only>
        </u-page-aside>
      </template>

      <player-wrapper />

      <u-page-body>
        <player-details
          v-if="player"
          :player
        />

        <loading-details v-else-if="status === 'pending'" />

        <empty
          v-else
          :message="`No details available about ${playerStore.fullName}.`"
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
