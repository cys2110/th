<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

definePageMeta({ name: "player" })

const tabItems: Array<TabsItem> = [
  { label: "Details", icon: ICONS.profile, slot: "details" },
  { label: "Win-Loss", icon: ICONS.stats, slot: "wl" },
  { label: "Most Frequent H2H", icon: ICONS.h2h, slot: "h2h" },
  { label: "Recent Events", icon: ICONS.years, slot: "recent" }
]
</script>

<template>
  <u-container>
    <u-page>
      <player-wrapper />

      <u-page-body>
        <u-tabs
          :items="tabItems"
          size="xs"
          :ui="{ content: 'px-4' }"
        >
          <template #details>
            <player-details />
          </template>

          <template #wl>
            <player-wl-table />
          </template>

          <template #h2h>
            <player-h2h-table />
          </template>

          <template #recent>
            <player-recent-events-table />
          </template>
        </u-tabs>
      </u-page-body>
    </u-page>
  </u-container>
</template>
