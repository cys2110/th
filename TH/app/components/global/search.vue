<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

const searchTerm = ref("")

const { data: results, status } = await useFetch("/api/search", {
  query: { searchTerm },
  default: () => [] as CommandPaletteGroup[],
  lazy: true,
  server: false,
  transform: data => {
    const players = data.filter(item => "tour" in item)
    const tournaments = data.filter(item => "name" in item)

    const groups = [
      {
        id: "players",
        label: "Players",
        items: players.map((item: PlayerSearchType) => ({
          label: `${item.first_name} ${item.last_name}`,
          icon: getFlagCode(item.country),
          tour: item.tour,
          slot: "player" as const,
          to: {
            name: "player",
            params: {
              id: item.id,
              name: kebabCase(`${item.first_name}-${item.last_name}`)
            }
          }
        }))
      },
      {
        id: "tournaments",
        label: "Tournaments",
        items: tournaments.map((item: BaseTournamentType) => ({
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
    ]

    return groups as CommandPaletteGroup[]
  }
})
</script>

<template>
  <u-modal title="Search players, tournaments and countries">
    <u-button
      :icon="icons.search"
      variant="ghost"
      color="neutral"
    />

    <template #content>
      <u-command-palette
        v-model:search-term="searchTerm"
        :groups="results"
        :loading="status === 'pending'"
      >
        <template #player-trailing="{ item }">
          <u-badge
            :label="item.tour"
            :color="item.tour"
            size="sm"
          />
        </template>
      </u-command-palette>
    </template>
  </u-modal>
</template>
