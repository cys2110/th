<script setup lang="ts">
const props = defineProps<{
  placeholder: string
  multiple?: boolean
}>()

const { results, pending, fetchSearchResults, searchTerm } = useVenueSearch()

const modelValue = defineModel<any>()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    @update:open="fetchSearchResults"
    :loading="pending"
    clear
    :placeholder
    :icon="ICONS.venue"
    :multiple
    :items="results"
    class="w-full"
    label-key="label"
  >
    <template #content-bottom>
      <venue-create @refresh="fetchSearchResults" />
    </template>
  </u-input-menu>
</template>
