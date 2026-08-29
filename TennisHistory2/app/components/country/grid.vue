<script setup lang="ts">
const props = defineProps<{
  countries: Array<CountryInterface>
  pending: boolean
}>()

defineEmits<{ refresh: [] }>()

const route = useRoute("countries")

const filteredCountries = computed(() =>
  props.countries.filter(country => !route.query.continent?.length || route.query.continent.includes(country.continent))
)
</script>

<template>
  <u-page-grid
    v-if="filteredCountries.length || pending"
    class="xl:grid-cols-4"
  >
    <country-card
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
    title="No countries available"
    :icon="ICONS.globeOff"
    @refresh="$emit('refresh')"
  />
</template>
