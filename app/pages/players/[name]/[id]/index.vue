<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

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

// Table columns
const columnHelper = createColumnHelper<WlType>()

const wlColumns: TableColumn<WlType>[] = [
  { accessorKey: "label", header: "" },
  columnHelper.group({
    header: "Total",
    columns: [
      columnHelper.group({
        header: "Singles",
        columns: [
          { accessorKey: "total.singles.wl", header: "Win-Loss" },
          { accessorKey: "total.singles.titles", header: "Titles" }
        ]
      }),
      columnHelper.group({
        header: "Doubles",
        columns: [
          { accessorKey: "total.doubles.wl", header: "Win-Loss" },
          { accessorKey: "total.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  columnHelper.group({
    header: "Main",
    columns: [
      columnHelper.group({
        header: "Singles",
        columns: [
          { accessorKey: "main.singles.wl", header: "Win-Loss" },
          { accessorKey: "main.singles.titles", header: "Titles" }
        ]
      }),
      columnHelper.group({
        header: "Doubles",
        columns: [
          { accessorKey: "main.doubles.wl", header: "Win-Loss" },
          { accessorKey: "main.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  columnHelper.group({
    header: "Qualifying",
    columns: [
      { accessorKey: "qualifying.singles", header: "Singles" },
      { accessorKey: "qualifying.doubles", header: "Doubles" }
    ]
  })
]

const h2hColumns: TableColumn<PlayerH2HType>[] = [
  { id: "opponent", header: "Opponent", meta: { class: { th: "text-left" } } },
  { id: "wl", header: "Win-Loss", meta: { class: { th: "text-right", td: "text-right" } } }
]
</script>

<template>
  <players-wrapper>
    <template #page-left="{ firstName, lastName, country, tour }">
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
          :player="{ ...player, first_name: firstName, last_name: lastName, country, tour }"
        />
      </dev-only>
    </template>

    <template #default="{ activeYears, firstName, lastName }">
      <details-grid>
        <div v-if="player?.age">
          <div>Age</div>
          <div>{{ player.age }} years</div>
          <div>{{
            player.dob && player.dod
              ? `${dateTimeFormat.formatRange(new Date(player.dob as string), new Date(player.dod as string))}`
              : useDateFormat(player.dob as string, "DD MMMM YYYY")
          }}</div>
        </div>

        <div v-if="player?.height">
          <div>Height</div>
          <div>{{ player.height }}cm ({{ convertToFt(player.height) }})</div>
        </div>

        <div v-if="player?.rh">
          <div>Plays</div>
          <div>{{ player.rh }}-Handed</div>
        </div>

        <div v-if="player?.bh">
          <div>Backhand</div>
          <div>{{ player.bh }}-Handed</div>
        </div>

        <div v-if="player?.turned_pro || player?.retired">
          <div>{{ player?.turned_pro && player?.retired ? "Pro Years" : player?.turned_pro ? "Turned Pro" : "Retired" }}</div>
          <div>{{ player?.turned_pro && player?.retired ? `${player.turned_pro}-${player.retired}` : player.turned_pro || player.retired }}</div>
          <div v-if="player?.turned_pro && (player?.retired || activeYears.active)">
            &nbsp;({{ (player.retired || new Date().getFullYear()) - player.turned_pro }} years)
          </div>
        </div>

        <div
          v-if="player?.ch_singles || player?.ch_doubles"
          class="row-span-2"
        >
          <div>Rankings</div>
          <div>
            <div class="grid grid-cols-3 gap-1 text-center">
              <div></div>
              <div class="text-muted font-semibold">Singles</div>
              <div class="text-muted font-semibold">Doubles</div>
              <div class="text-muted font-semibold">Current</div>
              <div>{{ player.current_singles ?? "—" }}</div>
              <div>{{ player.current_doubles ?? "—" }}</div>
              <div class="text-muted font-semibold">Career High</div>
              <div>{{ player.ch_singles ?? "—" }}</div>
              <div>{{ player.ch_doubles ?? "—" }}</div>
              <div class="text-muted font-semibold">Date</div>
              <div>
                {{ player.singles_ch_date ? useDateFormat(player.singles_ch_date as string, "DD MMMM YYYY") : "—" }}
              </div>
              <div>
                {{ player.doubles_ch_date ? useDateFormat(player.doubles_ch_date as string, "DD MMMM YYYY") : "—" }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>Career Prize Money</div>
          <div>{{ player?.pm?.toLocaleString("en-US", { style: "currency", currency: "USD" }) }}</div>
        </div>

        <div
          v-if="player?.coaches?.length || player?.former_coaches?.length"
          :class="`row-span-${(player?.coaches?.length || 0) + (player?.former_coaches?.length || 0)}`"
        >
          <div>Coaches</div>
          <div
            v-for="coach in player.coaches"
            :key="coach.id"
            class="flex items-center gap-2"
          >
            <dev-only>
              <person-update
                type="Coach"
                :person="coach"
              />

              <template #fallback>
                <u-link
                  v-if="coach.labels?.includes('Player')"
                  :to="{ name: 'player', params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }"
                  class="hover-link default-link"
                >
                  {{ coach.first_name }} {{ coach.last_name }}
                </u-link>
                <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
              </template>
            </dev-only>
            <span
              v-if="coach.years"
              class="text-dimmed shrink-0"
            >
              ({{ coach.years }})
            </span>
          </div>
          <div
            v-for="coach in player.former_coaches"
            :key="coach.id"
            class="flex items-center gap-2"
          >
            <dev-only>
              <person-update
                type="Coach"
                :person="coach"
              />

              <template #fallback>
                <u-link
                  v-if="coach.labels?.includes('Player')"
                  :to="{ name: 'player', params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }"
                  class="hover-link default-link"
                >
                  {{ coach.first_name }} {{ coach.last_name }}
                </u-link>
                <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
              </template>
            </dev-only>
            <span class="text-dimmed shrink-0"> ({{ coach.years ?? "Former" }}) </span>
          </div>
        </div>

        <div
          v-if="player?.former_countries?.length"
          :class="`row-span-${player.former_countries.length}`"
        >
          <div>Previous Representations</div>
          <div
            v-for="country in player.former_countries"
            :key="country.id"
            class="flex items-center gap-2"
          >
            <countries-link
              :country
              class="mx-0"
            />
            <span
              v-if="country.start_date && country.end_date"
              class="text-dimmed"
            >
              ({{ dateTimeFormat.formatRange(new Date(country.start_date as string), new Date(country.end_date as string)) }})
            </span>
          </div>
        </div>

        <div v-if="player?.hof">
          <div>Hall of Fame Induction</div>
          <div>{{ player.hof }}</div>
        </div>
      </details-grid>

      <client-only>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <dashboard-subpanel
            title="Win-Loss"
            :icon="ICONS.stats"
            class="col-span-2"
          >
            <u-table
              :data="player?.wl || []"
              :columns="wlColumns"
              :loading="status === 'pending'"
            >
              <template #loading>
                <u-icon
                  :name="icons.loading"
                  class="size-8"
                />
              </template>
              <template #empty>
                <empty
                  :message="`No win-loss data available for ${firstName} ${lastName}.`"
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
              :columns="h2hColumns"
              :loading="status === 'pending'"
            >
              <template #loading>
                <u-icon
                  :name="icons.loading"
                  class="size-8"
                />
              </template>
              <template #empty>
                <empty
                  :message="`No head to head data available for ${firstName} ${lastName}.`"
                  class="mx-2"
                />
              </template>
              <template #opponent-cell="{ row }">
                <players-link
                  v-if="row.original.opponent.last_name"
                  :player="row.original.opponent"
                />
              </template>
              <template #wl-cell="{ row }"> {{ row.original.wins }}-{{ row.original.matches - row.original.wins }} </template>
            </u-table>
          </dashboard-subpanel>
        </div>
      </client-only>
    </template>
  </players-wrapper>
</template>
