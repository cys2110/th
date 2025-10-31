<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

defineProps<{
  activeYears: {
    active: boolean
    activeYears: string
    numberOfYears: number
  }
}>()

const {
  params: { id, name }
} = useRoute("player")
const {
  ui: { icons }
} = useAppConfig()

const { data: player, status } = await useFetch<PlayerInterface>("/api/players/details", {
  query: { id }
})

const columnHelper = createColumnHelper<PlayerInterface["wl"][number]>()

const wlColumns: TableColumn<PlayerInterface["wl"][number]>[] = [
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

const h2hColumns: TableColumn<PlayerInterface["h2h"][number]>[] = [
  { id: "opponent", header: "Opponent", meta: { class: { th: "text-left" } } },
  { id: "wl", header: "Win-Loss", meta: { class: { th: "text-right", td: "text-right" } } }
]
</script>

<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-sm *:*:first:font-semibold *:*:last:ml-3">
      <div v-if="player?.age">
        <div>Age</div>
        <div>
          <div>{{ player.age }} years</div>
          <div>{{
            player.dob && player.dod
              ? `${dateTimeFormat.formatRange(new Date(player.dob), new Date(player.dod))}`
              : useDateFormat(player.dob, "DD MMMM YYYY")
          }}</div>
        </div>
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
              {{ player.singles_ch_date ? useDateFormat(player.singles_ch_date, "DD MMMM YYYY") : "—" }}
            </div>
            <div>
              {{ player.doubles_ch_date ? useDateFormat(player.doubles_ch_date, "DD MMMM YYYY") : "—" }}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div>Career Prize Money</div>
        <div>{{ player?.pm.toLocaleString("en-US", { style: "currency", currency: "USD" }) }}</div>
      </div>

      <div
        v-if="player?.coaches.length"
        :class="`row-span-${player.coaches.length}`"
      >
        <div>Coaches</div>
        <div>
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
                  v-if="coach.labels.includes('Player')"
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
              class="text-dimmed"
            >
              ({{ coach.years }})
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="player?.former_countries?.length"
        :class="`row-span-${player.former_countries.length}`"
      >
        <div>Previous Representations</div>
        <div>
          <div
            v-for="country in player.former_countries"
            :key="country.id"
            class="flex items-center gap-2"
          >
            <countries-link :country />
            <span
              v-if="country.start_date && country.end_date"
              class="text-dimmed"
            >
              ({{ dateTimeFormat.formatRange(new Date(country.start_date), new Date(country.end_date)) }})
            </span>
          </div>
        </div>
      </div>

      <div v-if="player?.hof">
        <div>Hall of Fame Induction</div>
        <div>{{ player.hof }}</div>
      </div>
    </div>

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
            <table-loading />
          </template>

          <template #empty>
            <u-empty
              title="No win-loss data available."
              description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
              :icon="icons.caution"
            >
              <template #actions>
                <u-button
                  label="Refresh"
                  :icon="icons.reload"
                  @click="reloadNuxtApp()"
                />
              </template>
            </u-empty>
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
            <table-loading />
          </template>

          <template #empty>
            <u-empty
              title="No head to head data available."
              description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
              :icon="icons.caution"
            >
              <template #actions>
                <u-button
                  label="Refresh"
                  :icon="icons.reload"
                  @click="reloadNuxtApp()"
                />
              </template>
            </u-empty>
          </template>
        </u-table>
      </dashboard-subpanel>
    </div>
  </div>
</template>
