<script setup lang="ts">
const { venues, pending, fetchVenues, searchTerm } = useVenueSearch()

type Venue = (typeof venues.value)[number]

const modelValue = defineModel<Venue>()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :loading="pending"
    clear
    ignore-filter
    label-key="name"
    placeholder="Venue"
    :items="venues"
    class="w-full"
  >
    <template #leading="{ modelValue: selectedVenue }">
      <u-icon :name="selectedVenue?.country.icon || 'material-symbols-light:stadium-outline-rounded'" />
    </template>

    <template #item-leading="{ item }">
      <u-icon :name="item.country.icon" />
    </template>

    <template #item-label="{ item }">
      {{ item.name ? `${item.name}, ${item.city}` : `${item.city}` }}
    </template>

    <template #item-description="{ item }">
      {{ item.country.name }}
    </template>

    <template #content-bottom>
      <venue-create @refresh="fetchVenues" />
    </template>
  </u-input-menu>
</template>
