<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui"

const route = useRoute()
const { ui } = useAppConfig()

const tournamentSearch = useTournamentSearch()
const playerSearch = usePlayerSearch()

const isOpen = ref(false)
const searchTerm = ref("")

const groups = computed<Array<CommandPaletteGroup>>(() => [
  {
    id: "players",
    label: "Players",
    ignoreFilter: true,
    item: playerSearch.results.value.map(player => ({
      id: player.id,
      label: player.full_name,
      icon: player.icon,
      to: { name: "player", params: { id: player.id, name: kebabCase(player.full_name) } }
    }))
  },
  {
    id: "tournaments",
    label: "Tournaments",
    ignoreFilter: true,
    items: tournamentSearch.results.value.map(tournament => ({
      id: tournament.id,
      label: tournament.name,
      to: { name: "tournament", params: { id: tournament.id, name: kebabCase(tournament.name) } }
    }))
  }
])

watch(
  searchTerm,
  () => {
    if (searchTerm.value) {
      tournamentSearch.searchTerm.value = searchTerm.value
      playerSearch.searchTerm.value = searchTerm.value
    }
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    set(isOpen, false)
  }
)
</script>

<template>
  <u-modal
    title="Search players and tournaments"
    v-model:open="isOpen"
  >
    <u-button
      color="neutral"
      variant="ghost"
      :icon="ui.icons.search"
    />

    <template #content>
      <u-command-palette
        :groups
        :loading="playerSearch.pending.value || tournamentSearch.pending.value"
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
