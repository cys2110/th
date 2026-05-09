<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

const { searchTerm: tournamentSearch, results: tournamentResults, loading: tournamentLoading, tournamentFilters } = useTournamentSearch()
const { searchTerm: playerSearch, loading: playerLoading, results: playerResults, selectedPlayers } = usePlayerSearch()

const isOpen = ref(false)
const searchTerm = ref<string>("")

watch(searchTerm, () => {
  if (searchTerm.value) {
    tournamentSearch.value = searchTerm.value
    playerSearch.value = searchTerm.value
  }
})

const groups = computed<Array<CommandPaletteGroup>>(() => [
  ...(playerResults.value.length ?
    [
      {
        id: "players",
        label: "Players",
        items: playerResults.value.map(item => ({
          ...item,
          to: {
            name: "player",
            params: {
              id: item.id,
              name: kebabCase(item.label)
            }
          }
        }))
      } as CommandPaletteGroup
    ]
  : []),
  ...(tournamentResults.value.length ?
    [
      {
        id: "tournaments",
        label: "Tournaments",
        items: tournamentResults.value.map(item => ({
          ...item,
          to: {
            name: "tournament",
            params: {
              id: item.id,
              name: kebabCase(item.label)
            }
          }
        }))
      } as CommandPaletteGroup
    ]
  : [])
])
</script>

<template>
  <u-modal
    title="Search players and tournaments"
    v-model:open="isOpen"
  >
    <u-button
      color="neutral"
      variant="ghost"
      :icon="icons.search"
    />

    <template #content>
      <u-command-palette
        :groups
        :loading="playerLoading || tournamentLoading"
        v-model:search-term="searchTerm"
        placeholder="Enter search..."
      >
        <template #empty>
          <empty
            v-if="searchTerm"
            :message="`No players or tournaments found matching ${searchTerm}`"
          />
          <div v-else>Search players and tournaments...</div>
        </template>
      </u-command-palette>
    </template>
  </u-modal>
</template>
