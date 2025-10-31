<script setup lang="ts">
const {
  params: { id, tour, edId }
} = useRoute("event")
const { devMode } = useRuntimeConfig().public

const { data: event, refresh } = await useFetch<EventInterface>("/api/events/event", {
  key: `${edId}-${tour}`,
  query: { id: `${edId}-${tour}` }
})
</script>

<template>
  <events-wrapper-table>
    <template
      #navbar-right
      v-if="devMode"
    >
      <events-update
        v-if="event"
        :event
        :refresh
        icon-only
      />
    </template>

    <template #toolbar>
      <dev-only>
        <events-scrape-draw v-if="['ATP', 'WTA'].includes(tour)" />
        <events-scrape-results v-if="tour === 'ATP'" />
        <events-scrape-stats v-if="['ATP', 'WTA'].includes(tour)" />
      </dev-only>
      <u-badge
        v-if="event"
        :color="event?.tour"
        :label="TourEnum[event?.tour]"
        class="w-full justify-center"
      />
      <u-badge
        v-if="event"
        :color="event?.level"
        :label="event?.level"
        class="w-full justify-center"
      />
      <u-badge
        color="success"
        :label="`Updated at: ${useDateFormat(event?.updated_at, 'DD MMMM YYYY').value}`"
        class="w-full justify-center"
      />
    </template>

    <events-country v-if="COUNTRY_DRAWS.includes(id)" />

    <events-overview v-else />
  </events-wrapper-table>
</template>
