<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { id }
} = useRoute("tournament")
const router = useRouter()
const tournamentStore = useTournamentStore()
const table = useTemplateRef("table")

const { data, status } = await useFetch("/api/tournament/finalists", {
  query: { id },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching tournament finalists:", error)
})

// Get singles and doubles WL totals per player and sort by last name, first name
const aggregatedData = computed<TournamentFinalistType[]>(() => {
  const uniquePlayers = useArrayUnique(data.value.map(d => d.id)).value

  return useSorted(
    uniquePlayers.map(id => {
      const player = data.value.filter(d => d.id === id)
      const firstEntry = player[0]!

      const singles_wins = player.reduce((acc, curr) => acc + (curr.title && curr.type === "Singles" ? 1 : 0), 0)
      const singles_losses = player.reduce((acc, curr) => acc + (curr.type === "Singles" && !curr.title ? 1 : 0), 0)
      const doubles_wins = player.reduce((acc, curr) => acc + (curr.title && curr.type === "Doubles" ? 1 : 0), 0)
      const doubles_losses = player.reduce((acc, curr) => acc + (curr.type === "Doubles" && !curr.title ? 1 : 0), 0)

      return {
        id: firstEntry.id,
        first_name: firstEntry.first_name,
        last_name: firstEntry.last_name,
        country: firstEntry.country,
        tour: firstEntry.tour,
        singles_wins,
        singles_losses,
        doubles_wins,
        doubles_losses
      }
    }),
    (a, b) => {
      if (a.last_name! < b.last_name!) return -1
      if (a.last_name! > b.last_name!) return 1

      if (a.first_name! < b.first_name!) return -1
      if (a.first_name! > b.first_name!) return 1

      return 0
    }
  ).value
})

const columnVisibility = computed(() => ({
  tour: tournamentStore.tours.length > 1
}))

const handleSelectRow = (_e: Event, row: TableRow<TournamentFinalistType>) => {
  const { id: playerId, first_name, last_name } = row.original

  router.push({
    name: "player",
    params: {
      id: playerId,
      name: kebabCase(`${first_name} ${last_name}`)
    }
  })
}
</script>

<template>
  <dashboard-subpanel
    title="Players by Number of Finals Played"
    :icon="ICONS.trophy"
  >
    <template #right>
      <table-client-clear-filters
        v-if="table"
        :table
      />

      <tournament-numbers-finalists-chart
        :finalists="aggregatedData"
        :status="status"
      />
    </template>

    <u-table
      ref="table"
      :data="aggregatedData"
      :columns="tournamentFinalistsColumns()"
      :loading="status === 'pending'"
      sticky
      @select="handleSelectRow"
      v-model:column-visibility="columnVisibility"
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :ui="{ th: 'text-center', td: 'empty:p-0 text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          :message="`No editions have been played for ${tournamentStore.name}`"
          :icon="ICONS.trophyOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
