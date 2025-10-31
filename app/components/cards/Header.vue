<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()
const { setViewMode } = useViewMode()

const searchTerm = ref("")

const { data: results, status } = await useFetch("/api/search", {
  key: searchTerm,
  query: { searchTerm },
  default: () => [],
  lazy: true,
  server: false,
  transform: (data: any) => {
    const nonNullData = data.filter((item: any) => item.labels)
    return nonNullData.map((item: any) => ({
      id: item.id?.low ?? item.id,
      label: item.name ?? `${item.first_name} ${item.last_name}`,
      to: {
        name: item.labels.includes("Player") ? "player" : item.labels.includes("Country") ? "country" : "tournament",
        params: {
          id: item.id?.low ?? item.id,
          name: kebabCase(item.name ?? `${item.first_name} ${item.last_name}`)
        }
      }
    }))
  }
})

const navLinks: NavigationMenuItem[] = [
  { label: "Results Archive", to: { name: "results-archive" }, icon: ICONS.event },
  { label: "Tournaments", icon: ICONS.tournament, to: { name: "tournaments" } },
  { label: "Players", icon: ICONS.player, to: { name: "players" } },
  { label: "Head to Head", to: { name: "h2h" }, icon: ICONS.h2h },
  { label: "Stats/Records", to: { name: "statistics-and-records" }, icon: ICONS.stats },
  { label: "Countries", to: { name: "countries" }, icon: ICONS.countries },
  { label: "Years", to: { name: "years" }, icon: ICONS.year },
  { label: "About", icon: icons.info, to: { name: "about" } }
]

const groups = computed(() => [
  {
    id: "results",
    label: searchTerm.value ? `Results matching ${searchTerm.value}` : "Search players, tournaments or countries",
    items: get(results) || []
  }
])

const handleSwitchView = () => {
  setViewMode("table")
  reloadNuxtApp()
}
</script>

<template>
  <u-header
    title="Tennis History"
    mode="drawer"
  >
    <u-navigation-menu
      :items="navLinks"
      color="primary"
      highlight
      highlight-color="primary"
      variant="link"
      content-orientation="vertical"
    />

    <template #right>
      <u-modal>
        <u-button
          :icon="icons.search"
          variant="ghost"
          color="neutral"
        />

        <template #content>
          <u-command-palette
            v-model:search-term="searchTerm"
            :groups
            :loading="status === 'pending'"
          />
        </template>
      </u-modal>
      <u-color-mode-button />
      <u-button
        :icon="ICONS.table"
        variant="ghost"
        color="neutral"
        @click="handleSwitchView"
      />
    </template>

    <template #body>
      <u-navigation-menu
        :items="navLinks"
        orientation="vertical"
        highlight
        highlight-color="primary"
      />
    </template>
  </u-header>
</template>
