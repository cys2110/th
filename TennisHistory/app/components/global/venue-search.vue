<script setup lang="ts">
const { venues, pending, searchTerm } = useVenueSearch()

const modelValue = defineModel<VenueType>()
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
      <u-icon :name="selectedVenue?.icon || 'material-symbols-light:stadium-outline-rounded'" />
    </template>

    <template #item-leading="{ item }">
      <u-icon :name="item.icon" />
    </template>

    <template #item-label="{ item }">
      {{ item.name || item.city }}
    </template>

    <template #item-description="{ item }">
      <span v-if="item.name">{{ item.city }}</span>
    </template>
  </u-input-menu>
</template>
