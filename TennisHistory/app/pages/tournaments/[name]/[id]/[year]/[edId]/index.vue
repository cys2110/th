<script setup lang="ts">
import type { PageAnchor } from "@nuxt/ui"

definePageMeta({ name: "edition" })

const {
  params: { id, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const pageAnchors = computed<Array<PageAnchor>>(() => {
  const anchors: Array<PageAnchor> = [{ label: "Details", to: "#details", icon: ICONS.cards }]

  if (!COUNTRY_DRAWS.includes(id) && id !== "9210") {
    anchors.push({ label: "Awards", to: "#awards", icon: ICONS.money })
  }

  if (id !== "9210") anchors.push({ label: "Seeds", to: "#seeds", icon: ICONS.ranking })

  if (!COUNTRY_DRAWS.includes(id)) anchors.push({ label: "Entry Information", to: "#entry-info", icon: icons.info })

  anchors.push({ label: "Entries", to: "#entries", icon: COUNTRY_DRAWS.includes(id) ? ICONS.globe : ICONS.player })

  return anchors
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-page-anchors :links="pageAnchors" />
        </u-page-aside>
      </template>

      <edition-wrapper>
        <template #header-links>
          <dev-only>
            <event-create />
          </dev-only>
        </template>
      </edition-wrapper>

      <u-page-body>
        <div v-if="COUNTRY_DRAWS.includes(id)">
          <event-scrape-stats
            tour="ITF-M"
            :event_id="`${edId}-Country`"
          />
        </div>
        <u-page-list class="space-y-5">
          <edition-details id="details" />

          <edition-awards
            v-if="id !== '9210' && !COUNTRY_DRAWS.includes(id)"
            id="awards"
          />

          <edition-seeds-country
            v-if="COUNTRY_DRAWS.includes(id)"
            id="seeds"
          />

          <edition-seeds
            v-else-if="id !== '9210'"
            id="seeds"
          />

          <edition-entry-info
            v-if="!COUNTRY_DRAWS.includes(id) && id !== '9210'"
            id="entry-info"
          />

          <edition-entries id="entries" />
        </u-page-list>
      </u-page-body>
    </u-page>
  </u-container>
</template>
