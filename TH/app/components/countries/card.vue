<script setup lang="ts">
/**
 * @description Basic card to display country information
 * @param {CountryType} country - The country to display
 */

defineProps<{
  country: CountryType
}>()
</script>

<template>
  <u-page-card
    :icon="getFlagCode(country)"
    :title="country.name"
    :description="country.continent"
    :to="{ name: 'country', params: { id: country.id, name: kebabCase(country.name) } }"
    highlight
  />
</template>
