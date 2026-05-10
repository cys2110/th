<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

definePageMeta({ name: "edition" })

const {
  params: { id }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const isDefaultEdition = computed(() => !COUNTRY_DRAWS.includes(id) && id !== "9210")

const tabItems = computed<Array<TabsItem>>(() => [
  { label: "Details", icon: ICONS.racquet, slot: "details" },
  ...(isDefaultEdition.value ? [{ label: "Awards", icon: ICONS.money, slot: "awards" }] : []),
  ...(id !== "9210" ? [{ label: "Seeds", icon: ICONS.ranking, slot: "seeds" }] : []),
  ...(!COUNTRY_DRAWS.includes(id) ? [{ label: "Entry Information", icon: icons.info }] : []),
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
            <edition-awards />
          </template>

          <template #seeds>
            <edition-seeds />
          </template>
        </u-tabs>
      </u-page-body>
    </u-page>
  </u-container>
</template>
