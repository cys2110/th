<script setup lang="ts">
definePageMeta({ name: "player" })

const {
  params: { id, name }
} = useRoute("player")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

// API call
const { data: player, status } = await useFetch("/api/players", {
  query: { id }
})

// Scraping
const scraping = ref(false)

defineShortcuts({
  meta_shift_s: () => handleScrape()
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
    reloadNuxtApp()
  } catch (e) {
    console.error(e)
    toast.add({
      title: "Error updating player",
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
            class="w-full justify-center"
            :label="`Updated on ${useDateFormat(player.updated_at as string, 'DD MMMM YYYY').value}`"
            color="success"
          />

          <dev-only>
            <u-button
              v-if="scrapeEnabled"
              label="Scrape player"
              @click="handleScrape"
              block
              :icon="scraping ? ICONS.downloading : ICONS.download"
            />

            <players-update
              v-if="player"
              :player
            />
          </dev-only>
        </u-page-aside>
      </template>

      <players-wrapper />

      <u-page-body>
        <players-details
          :player
          :status
        />

        <client-only>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
            <dashboard-subpanel
              title="Win-Loss"
              :icon="ICONS.stats"
              class="col-span-2"
            >
              <u-table
                :data="player?.wl || []"
                :columns="playerWlColumns"
                :loading="status === 'pending'"
              >
                <template #loading>
                  <loading-icon />
                </template>
                <template #empty>
                  <empty
                    :message="`No win-loss data available for  ${player ? `${player.first_name} ${player.last_name}` : capitalCase(name)}.`"
                    class="mx-2"
                  />
                </template>
              </u-table>
            </dashboard-subpanel>

            <dashboard-subpanel
              title="Most Frequent Head to Heads"
              :icon="ICONS.h2h"
            >
              <u-table
                :data="player?.h2h || []"
                :columns="playerH2hColumns"
                :loading="status === 'pending'"
              >
                <template #loading>
                  <loading-icon />
                </template>
                <template #empty>
                  <empty
                    :message="`No head to head data available for ${player ? `${player.first_name} ${player.last_name}` : capitalCase(name)}.`"
                    class="mx-2"
                  />
                </template>
              </u-table>
            </dashboard-subpanel>
          </div>
        </client-only>
      </u-page-body>
    </u-page>
  </u-container>
</template>
