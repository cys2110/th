<script setup lang="ts">
import type { PageAnchor } from "@nuxt/ui"

definePageMeta({ name: "edition" })

const {
  params: { id, edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()

const pageAnchors = computed<PageAnchor[]>(() => {
  const anchors: PageAnchor[] = [{ label: "Details", to: "#details", icon: ICONS.cards }]

  if (!COUNTRY_DRAWS.includes(id)) anchors.push({ label: "Awards", to: "#awards", icon: ICONS.awards })

  anchors.push({ label: "Seeds", to: "#seeds", icon: ICONS.seeds })

  if (!COUNTRY_DRAWS.includes(id)) anchors.push({ label: "Entry Information", to: "#entry-info", icon: icons.info })

  anchors.push({ label: "Entries", to: "#entries", icon: ICONS.player })

  return anchors
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-separator v-if="!COUNTRY_DRAWS.includes(id)" />

          <u-page-anchors :links="pageAnchors" />
        </u-page-aside>
      </template>

      <edition-wrapper />

      <u-page-body class="mt-0">
        <u-page-list class="*:my-5">
          <edition-details id="details" />

          <edition-awards id="awards" />

          <edition-seeds-country
            v-if="COUNTRY_DRAWS.includes(id)"
            id="seeds"
          />

          <edition-seeds
            v-else
            id="seeds"
          />

          <edition-entry-info
            v-if="!COUNTRY_DRAWS.includes(id)"
            id="entry-info"
          />

          <edition-entries id="entries" />
        </u-page-list>
      </u-page-body>
    </u-page>
  </u-container>
</template>
