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
} = await useFetch("/api/editions", {
  key: edId,
  query: { edId }
})

const toc = [
  { label: "Details", to: "#details", icon: ICONS.overview },
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

            <events-update
              v-if="edition"
              :edition
              :refresh
            />

            <events-update
              v-if="edition"
              v-for="event in edition.events"
              :key="event.id"
              :event
              :edition
              :refresh
            />
          </dev-only>

          <u-separator />

          <u-page-links
            v-if="!COUNTRY_DRAWS.includes(id)"
            :links="toc"
          />
        </u-page-aside>
      </template>

      <editions-wrapper />

      <u-page-body class="mt-0">
        <u-page-list class="*:my-5 scrollbar-none">
          <editions-details
            id="details"
            :edition
            :status
          />

          <editions-awards
            id="awards"
            :tours="edition?.tours || []"
          />

          <editions-seeds
            id="seeds"
            :tours="edition?.tours || []"
          />

          <editions-entry-info
            id="entry-info"
            :tours="edition?.tours || []"
          />

          <editions-entries
            id="entries"
            :tours="edition?.tours || []"
          />
        </u-page-list>
      </u-page-body>
    </u-page>
  </u-container>
</template>
