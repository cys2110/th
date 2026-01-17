<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

defineProps<{
  countries: CountryType[]
  status: AsyncDataRequestStatus
}>()
</script>

<template>
  <u-page-grid
    v-if="countries.length || status === 'pending'"
    class="xl:grid-cols-4"
  >
    <countries-card
      v-if="countries.length"
      v-for="country in countries"
      :key="country.id"
      :country="country"
    />

    <loading-card
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-grid>

  <empty
    v-else
    message="No countries found"
    :icon="ICONS.globeOff"
  />
</template>
