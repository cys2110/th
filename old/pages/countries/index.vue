<script setup lang="ts">
useHead({ title: "Countries" })
const { viewMode } = useViewMode()

const { data: countries, status } = await useFetch<CountryInterface[]>("/api/countries", {
  key: "countries",
  default: () => [],
  server: false
})
</script>

<template>
  <div class="w-full">
    <country-table
      v-if="viewMode === 'table'"
      :countries
      :status
    />
    <country-cards
      v-else
      :countries
      :status
    />
  </div>
</template>
