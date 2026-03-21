<script setup lang="ts">
const props = defineProps<{
  countries: Array<CountryType>
  pending: boolean
  filters: CountryFiltersInterface
}>()

const filteredCountries = computed(() =>
  (props.countries || []).filter(country => {
    const isCountryMatch = !props.filters.countries.length || props.filters.countries.some(c => c === country.id)
    const isContinentMatch = !props.filters.continents.length || props.filters.continents.some(c => c === country.continent)
    return isCountryMatch && isContinentMatch
  })
)
</script>

<template>
  <u-page-grid
    v-if="filteredCountries.length || pending"
    class="xl:grid-cols-4"
  >
    <countries-card
      v-if="filteredCountries.length"
      v-for="country in filteredCountries"
      :key="country.id"
      :country
    />

    <loading-card
      v-if="pending"
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
