<script setup lang="ts">
defineProps<{ country: CountryInterface }>()
</script>

<template>
  <u-page-card
    :icon="getFlagCode(country)"
    :title="country.name"
    :description="country.continent"
    highlight
    :to="{
      name: 'country',
      params: { id: country.id, name: kebabCase(country.name) }
    }"
  />
</template>
