<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const route = useRoute()

const {
  ui: { icons }
} = useAppConfig()

const viewModeStore = useViewModeStore()

// Navigation menu items
const navLinks = computed<Array<NavigationMenuItem>>(() => [
  {
    label: "Results",
    icon: ICONS.years,
    active: route.name === "results-archive" || route.name.startsWith("tournaments"),
    defaultOpen: true,
    to: { name: "results-archive" },
    children: [
      { label: "Archive", icon: ICONS.calendar, to: { name: "results-archive" } },
      { label: "Tournaments", icon: ICONS.trophy, to: { name: "tournaments" } }
    ]
  },
  {
    label: "Players",
    icon: ICONS.racquet,
    active: route.name.startsWith("players") || route.name.startsWith("h2h"),
    defaultOpen: true,
    to: { name: "players" },
    children: [
      { label: "All Players", icon: ICONS.player, to: { name: "players" } },
      { label: "Head to Head", icon: ICONS.h2h, to: { name: "h2h" } }
    ]
  },
  {
    label: "Stats/Records",
    icon: ICONS.stats,
    to: { name: "statistics-and-records" },
    active: route.name === "statistics-and-records" || route.name.startsWith("countries") || route.name === "years",
    defaultOpen: true,
    children: [
      { label: "Countries", icon: ICONS.globe, to: { name: "countries" } },
      { label: "Years", icon: ICONS.years, to: { name: "years" } }
    ]
  },
  { label: "About", icon: icons.info, to: { name: "about" } }
])

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
      color="primary"
      highlight
      highlight-color="primary"
      content-orientation="vertical"
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
