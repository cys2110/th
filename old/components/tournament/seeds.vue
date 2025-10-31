<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const {
  params: { id, name }
} = useRoute("tournament")
const {
  icons,
  ui: { icons: uIcons }
} = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: results, status } = await useFetch<TournamentSeedType[]>("/api/tournaments/seeds", {
  key: `tournament-seeds-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const gridColumns: TableColumn<TournamentSeedType["teams"][number]>[] = [
  { accessorKey: "seed", header: "Seed" },
  { id: "players", header: "Players(s)" }
]
</script>

<template>
  <u-page-columns
    v-if="results.length || ['idle', 'pending'].includes(status)"
    class="lg:columns-2"
  >
    <u-card
      v-if="results.length"
      v-for="result in results"
      :key="`${result.id}-${result.tour}-${result.type}`"
      :ui="{ root: 'ring-primary', header: 'flex items-center justify-between' }"
    >
      <template #header>
        <div>
          <u-link
            :to="{ name: 'event', params: { id, name, year: result.year, eid: result.id } }"
            class="hover-link default-link font-semibold"
          >
            {{ result.year }}
          </u-link>
          — {{ result.round }}
        </div>
        <div class="flex items-center gap-2">
          <u-badge
            :label="result.tour"
            :color="getTourColour(result.tour)"
          />
          <u-badge
            :label="result.type"
            :color="getMatchTypeColour(result.type)"
          />
        </div>
      </template>

      <u-table
        :data="result.teams"
        :columns="gridColumns"
        class="w-fit mx-auto"
      >
        <template #players-cell="{ row }">
          <div class="flex flex-col items-center mx-10">
            <player-link
              v-for="player in row.original.players"
              :key="player.id"
              :player
            />
          </div>
        </template>
      </u-table>
    </u-card>

    <loading-player
      v-else
      v-for="_ in 4"
      :key="_"
    />
  </u-page-columns>
  <error-message
    v-else
    :icon="icons.seeds"
    :message="`No years when the top seeds reached the later rounds of ${tournamentName}`"
  />
</template>
