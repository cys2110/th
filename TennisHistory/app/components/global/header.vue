<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const route = useRoute()

const {
  ui: { icons }
} = useAppConfig()

const viewModeStore = useViewModeStore()

// Navigation menu items
const navLinks: NavigationMenuItem[] = [
  { label: "Results Archive", icon: ICONS.calendar, to: { name: "results-archive" } },
  { label: "Tournaments", icon: ICONS.trophy, to: { name: "tournaments" } },
  { label: "Players", icon: ICONS.player, to: { name: "players" } },
  { label: "Head to Head", icon: ICONS.h2h, to: { name: "h2h" } },
  { label: "Stats/Records", icon: ICONS.stats, to: { name: "statistics-and-records" } },
  { label: "Countries", icon: ICONS.globe, to: { name: "countries" } },
  { label: "Years", icon: ICONS.years, to: { name: "years" } },
  { label: "About", icon: icons.info, to: { name: "about" } }
]

const showViewSwitcher = computed(() => {
  const currentRouteName = route.name
  const viewSwitcherRoutes = ["tournaments", "tournament", "results", "players", "countries"]
  return viewSwitcherRoutes.includes(currentRouteName)
})
</script>

<template>
  <u-header
    title="TennisHistory"
    mode="drawer"
  >
    <template #right>
      <search />

      <u-button
        v-if="showViewSwitcher"
        variant="ghost"
        :icon="viewModeStore.isTableView ? ICONS.table : ICONS.cards"
        @click="viewModeStore.toggleViewMode"
        color="neutral"
      />

      <u-color-mode-button />
    </template>

    <u-navigation-menu
      :items="navLinks"
      highlight
      highlight-color="primary"
    />

    <!-- Need to include body template to show on mobile screens -->
    <template #body>
      <u-navigation-menu
        :items="navLinks"
        highlight
        highlight-color="primary"
        orientation="vertical"
      />
    </template>
  </u-header>
</template>
