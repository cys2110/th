<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const route = useRoute()

const navLinks = computed<Array<NavigationMenuItem>>(() => [
  {
    label: "Federations",
    active: route.path.startsWith("/federations"),
    to: { name: "federations" }
  },
  {
    label: "People",
    active: route.path.startsWith("/players"),
    defaultOpen: true,
    children: [{ label: "Players", to: { name: "players" }, icon: ICONS.player }]
  },
  {
    label: "Competitions",
    active: route.path.startsWith("/competitions"),
    to: { name: "competitions" }
  },
  {
    label: "Teams",
    active: route.path.startsWith("/teams"),
    to: { name: "teams" }
  }
])
</script>

<template>
  <u-header
    title="FootballHistory"
    mode="drawer"
  >
    <template #right>
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
