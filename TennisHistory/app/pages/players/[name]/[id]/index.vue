<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

definePageMeta({ name: "player" })

const {
  params: { id }
} = useRoute("player")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const router = useRouter()

// API call
// const { data: player, status } = await useFetch("/api/players", {
//   query: { id }
// })

// const scraping = ref(false)
// const playerName = useState("playerName")

// defineShortcuts({
//   meta_shift_s: () => handleScrape()
// })

// const scrapeEnabled = computed(() => {
//   const singlesChDate = player.value?.singles_ch_date ? new Date(player.value?.singles_ch_date) : null
//   const doublesChDate = player.value?.doubles_ch_date ? new Date(player.value?.doubles_ch_date) : null
//   const cutoffDate = new Date("2001-01-01")
//   if (
//     (singlesChDate && singlesChDate < cutoffDate) ||
//     (doublesChDate && doublesChDate < cutoffDate) ||
//     (player.value?.retired && player.value.retired < 2024) ||
//     player.value?.dod
//   ) {
//     return false
//   }
//   return true
// })
// const handleScrape = async () => {
//   set(scraping, true)
//   try {
//     const apiSlug = isNaN(Number(id)) ? "atp_player" : "wta_player"
//     const response = await $fetch(`${FLASK_ROUTE}/${apiSlug}/` + id, {
//       method: "GET",
//       timeout: 120_000
//     })
//     if ((response as any).ok) {
//       toast.add({
//         title: "Player updated",
//         icon: icons.success,
//         color: "success"
//       })
//     } else {
//       toast.add({
//         title: "Error updating player",
//         icon: icons.error,
//         color: "error"
//       })
//     }
//     reloadNuxtApp() // Must reload rather than just refetch in order to update the wrapper
//   } catch (e) {
//     console.error(e)
//     toast.add({
//       title: "Error updating player",
//       icon: icons.error,
//       color: "error"
//     })
//   } finally {
//     set(scraping, false)
//   }
// }

// const handleSelect = (e: Event, row: TableRow<WlType>) => {
//   router.push({
//     name: "player",
//     params: {
//       id: row.original.opponent.id,
//       name: row.original.opponent.last_name ? kebabCase(`${row.original.opponent.first_name} ${row.original.opponent.last_name}`) : "—"
//     }
//   })
// }
</script>

<template>
  <u-container>
    <!-- <u-page>
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
                    :message="`No win-loss data available for  ${playerName}.`"
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
                @select="handleSelect"
                :ui="{ tbody: '[&>tr]:cursor-pointer' }"
              >
                <template #loading>
                  <loading-icon />
                </template>
                <template #empty>
                  <empty
                    :message="`No head to head data available for ${playerName}.`"
                    class="mx-2"
                  />
                </template>
              </u-table>
            </dashboard-subpanel>
          </div>
        </client-only>
      </u-page-body>
    </u-page> -->
  </u-container>
</template>
