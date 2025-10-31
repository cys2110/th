<script setup lang="ts">
const {
  icons,
  ui: { colors }
} = useAppConfig()
const {
  params: { id, name }
} = useRoute("country")

const countryName = useState<string>("country-name")

// API call
const { data: venues, status } = await useFetch<VenueInterface[]>("/api/countries/venues", {
  query: { id },
  default: () => [],
  server: false
})
</script>

<template>
  <dashboard-subpanel
    :title="`Venues ${countryName || capitalCase(name as string)}`"
    :icon="icons.venue"
    id="venues"
  >
    <u-page-columns
      v-if="venues.length || ['idle', 'pending'].includes(status)"
      class="scroll-smooth overflow-y-auto p-5"
    >
      <u-page-card
        v-if="venues.length"
        v-for="venue in venues"
        :key="venue.id"
        highlight
        :title="venue.name ? `${venue.name}, ${venue.city}` : venue.city"
        :icon="getFlagCode(venue.country)"
        :to="{ name: 'venue', params: { id: kebabCase(venue.id) } }"
      />

      <loading-base
        v-else
        v-for="_ in 6"
        :key="_"
      />
    </u-page-columns>
    <error-message
      v-else
      :message="`No venues located in ${countryName || capitalCase(name as string)}`"
    />
  </dashboard-subpanel>
</template>
