<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

const { searchTerm: tournamentSearch, results: tournamentResults, pending: tournamentLoading } = useTournamentSearch()
const { searchTerm: playerSearch, pending: playerLoading, results: playerResults } = usePlayerSearch()

const isOpen = ref(false)
const searchTerm = ref<string>("")

watch(
  searchTerm,
  () => {
    if (searchTerm.value) {
      tournamentSearch.value = searchTerm.value
      playerSearch.value = searchTerm.value
    }
  },
  { immediate: true }
)

const groups = computed<Array<CommandPaletteGroup>>(() => [
  {
    id: "players",
    label: "Players",
    ignoreFilter: true,
    items: playerResults.value.map(item => ({
      id: item.id,
      label: item.name,
      icon: item.icon,
      to: {
        name: "player",
        params: {
          id: item.id,
          name: kebabCase(item.name)
        }
      }
    }))
  },
  {
    id: "tournaments",
    label: "Tournaments",
    ignoreFilter: true,
    items: tournamentResults.value.map(item => ({
      id: item.id,
      label: item.name,
      to: {
        name: "tournament",
        params: {
          id: item.id,
          name: kebabCase(item.name)
        }
      }
    }))
  }
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
          <u-empty
            v-if="searchTerm"
            :title="`No players or tournaments found matching ${searchTerm}`"
            class="mx-2"
          />
          <div v-else>Search players and tournaments...</div>
        </template>
      </u-command-palette>
    </template>
  </u-modal>
</template>
