<script setup lang="ts">
definePageMeta({ name: "event" })
const {
  params: { tour, edId, id, name }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()

const tournamentName = useState<string>("tournament-name", () => capitalCase(name))

const { data: event, refresh } = await useFetch("/api/events/event", {
  key: `${edId}-${tour}`,
  query: { edId, tour },
  onResponse: ({ response }) => {
    tournamentName.value = response._data?.edition?.tournament?.name || tournamentName.value
  }
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
  <events-wrapper>
    <template #page-left>
      <dev-only>
        <events-update
          v-if="event"
          :event
          :refresh
        />
        <events-scrape-draw v-if="['ATP', 'WTA'].includes(tour)" />
        <events-scrape-results v-if="tour === 'ATP'" />
        <events-scrape-stats v-if="['ATP', 'WTA'].includes(tour)" />
      </dev-only>

      <u-page-aside>
        <u-page-links
          v-if="!COUNTRY_DRAWS.includes(id)"
          :links="toc"
        />
        <slot name="page-right" />
      </u-page-aside>
    </template>

    <u-page-list class="*:my-5 scrollbar-none">
      <events-details
        v-if="event"
        :event
      />
      <events-awards />
      <events-seeds />
      <events-entry-info />
      <events-entries />
    </u-page-list>
  </events-wrapper>
</template>
