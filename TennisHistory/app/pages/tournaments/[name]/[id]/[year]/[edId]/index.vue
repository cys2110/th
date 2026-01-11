<script setup lang="ts">
definePageMeta({ name: "edition" })

const {
  params: { id, edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()

const {
  data: edition,
  status,
  refresh
} = await useFetch("/api/edition", {
  key: edId,
  query: { edId },
  onResponseError: ({ error }) => console.error("Error fetching edition:", error)
})

const toc = [
  { label: "Details", to: "#details", icon: ICONS.cards },
  { label: "Awards", to: "#awards", icon: ICONS.awards },
  { label: "Seeds", to: "#seeds", icon: ICONS.seeds },
  { label: "Entry Information", to: "#entry-info", icon: icons.info },
  { label: "Entries", to: "#entries", icon: ICONS.player }
]
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-badge
            color="success"
            :label="`Updated: ${useDateFormat(edition?.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />

          <dev-only>
            <editions-update
              :edition
              :refresh
            />

            <events-update :refresh />

            <edition-awards-country v-if="COUNTRY_DRAWS.includes(id)" />
          </dev-only>

          <u-separator v-if="!COUNTRY_DRAWS.includes(id)" />

          <u-page-links
            v-if="!COUNTRY_DRAWS.includes(id)"
            :links="toc"
          />
        </u-page-aside>
      </template>

      <edition-wrapper />

      <u-page-body class="mt-0">
        <u-page-list class="*:my-5">
          <edition-details
            id="details"
            :edition
            :status
            :refresh
          />

          <edition-awards
            v-if="!COUNTRY_DRAWS.includes(id)"
            id="awards"
          />

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
