<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

definePageMeta({ name: "player" })

const tabItems: Array<TabsItem> = [
  { label: "Details", icon: ICONS.profile, slot: "details" },
  { label: "Win-Loss", icon: ICONS.stats, slot: "wl" },
  { label: "Most Request H2H", icon: ICONS.h2h, slot: "h2h" },
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
        </u-tabs>
      </u-page-body>
    </u-page>
  </u-container>
</template>
