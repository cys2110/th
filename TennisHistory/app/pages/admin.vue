<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

definePageMeta({ name: "admin" })
useHead({ title: "Admin" })

const items: Array<TabsItem> = [
  { label: "Player", icon: ICONS.player, value: "player", slot: "player" as const },
  { label: "Tournament", icon: ICONS.trophy, value: "tournament", slot: "tournament" as const },
  { label: "Edition", icon: ICONS.calendar, value: "edition", slot: "edition" as const },
  { label: "Country", icon: ICONS.globe, value: "country", slot: "country" as const },
  { label: "Venue", icon: ICONS.venue, value: "venue", slot: "venue" as const }
]
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header title="Admin" />

      <u-page_body>
        <u-tabs
          :items
          variant="link"
          orientation="vertical"
          default-value="edition"
        >
          <template #player>
            <admin-player />
          </template>

          <template #tournament>
            <admin-tournament />
          </template>

          <template #edition>
            <admin-edition />
          </template>

          <template #country>
            <admin-country />
          </template>

          <template #venue>
            <admin-venue />
          </template>
        </u-tabs>
      </u-page_body>
    </u-page>
  </u-container>
</template>
