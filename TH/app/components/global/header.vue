<script setup lang="ts">
/**
 * @description Header component with navigation menu.
 */

import type { NavigationMenuItem } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

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
</script>

<template>
  <u-header
    title="Tennis History"
    mode="drawer"
  >
    <template #right>
      <!--Search-->
      <search />

      <!--Switch color mode-->
      <u-color-mode-button />
    </template>

    <u-navigation-menu
      :items="navLinks"
      highlight
      highlight-color="primary"
      variant="link"
    />

    <!-- Need to include body template to show on mobile screens -->
    <template #body>
      <u-navigation-menu
        :items="navLinks"
        highlight
        highlight-color="primary"
        variant="link"
        orientation="vertical"
      />
    </template>
  </u-header>
</template>
