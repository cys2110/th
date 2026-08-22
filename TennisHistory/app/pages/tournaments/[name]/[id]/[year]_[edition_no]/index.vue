<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

definePageMeta({ name: "edition" })

const route = useRoute("edition")
const { ui } = useAppConfig()

const tournamentType = computed(() => getTournamentType(route.params.name as string))

const tabItems = computed<Array<TabsItem>>(() => [
  { label: "Details", icon: ICONS.racquet, slot: "details" },
  ...(tournamentType.value === "elimination" ? [{ label: "Awards", icon: ICONS.money, slot: "awards" }] : []),
  ...(tournamentType.value !== "laver" ? [{ label: "Seeds", icon: ICONS.ranking, slot: "seeds" }] : []),
  ...(tournamentType.value !== "country" ? [{ label: "Entry Information", icon: ui.icons.info, slot: "entry-info" }] : []),
  { label: "Entries", icon: ICONS.player, slot: "entries" }
])
</script>

<template>
  <u-container>
    <u-page>
      <edition-wrapper />

      <u-page-body>
        <u-tabs
          :items="tabItems"
          size="xs"
          :ui="{ content: 'px-4' }"
        >
          <template #details>
            <edition-details />
          </template>

          <template #awards>
            <edition-rounds />
          </template>

          <template #seeds>
            <!-- <edition-seeds-country v-if="COUNTRY_DRAWS.includes(id)" />

            <edition-seeds v-else /> -->
          </template>

          <template #entry-info>
            <!-- <edition-entry-info /> -->
          </template>

          <template #entries>
            <!-- <edition-entries /> -->
          </template>
        </u-tabs>
      </u-page-body>
    </u-page>
  </u-container>
</template>
