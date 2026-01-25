<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()
const { devMode } = useRuntimeConfig().public

const isOpen = ref(false)
const searchTerm = ref<string>("")

const { data, status, refresh, error } = useLazyFetch("/api/search", {
  query: { searchTerm },
  server: false,
  immediate: false,
  default: () => ({ statusObjects: [], results: [] as CommandPaletteGroup[] })
})

const groups = computed<CommandPaletteGroup[]>(() => {
  if (data.value) {
    const players = data.value.results.filter(item => "tour" in item)
    const tournaments = data.value.results.filter(item => "name" in item)

    const results = [
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

    return results as CommandPaletteGroup[]
  } else {
    return [] as CommandPaletteGroup[]
  }
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info("Search API Status Objects:", data.value.statusObjects)
    }
  },
  { immediate: true }
)

watch(
  error,
  newError => {
    if (newError) {
      if (newError.statusMessage) {
        console.error(newError.statusMessage, newError.data?.data)
      } else {
        console.error(newError)
      }
    }
  },
  { immediate: true }
)

watch([isOpen, searchTerm], () => {
  if (get(isOpen) && get(searchTerm).length >= 2) refresh()
})
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
      <api-alerts :error />

      <u-command-palette
        :groups
        :loading="status === 'pending'"
        v-model:search-term="searchTerm"
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
