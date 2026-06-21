<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

const tabItems: Array<TabsItem> = [
  { label: "Winner Stats", icon: ICONS.one, slot: "winners" },
  { label: "Finalists", icon: ICONS.racquet, slot: "finalists" },
  { label: "Country Stats", icon: ICONS.globe, slot: "countries" },
  { label: "Tournament Stats", icon: ICONS.trophy, slot: "tournament" }
]
</script>

<template>
  <login-alert>
    <u-tabs
      :items="tabItems"
      size="xs"
    >
      <template #winners>
        <tournament-numbers-winners />
      </template>
      <template #finalists>
        <tournament-numbers-finalists />
      </template>
      <template #countries>
        <tournament-numbers-countries />
      </template>
      <template #tournament>
        <tournament-numbers-tournament />
      </template>
    </u-tabs>
  </login-alert>
</template>
