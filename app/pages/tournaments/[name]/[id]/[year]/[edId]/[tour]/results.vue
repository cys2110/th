<script setup lang="ts">
definePageMeta({ name: "results" })
const { viewMode } = useViewMode()
const {
  params: { edId, tour }
} = useRoute("results")

const { data: matches, status } = await useFetch<MatchInterface[]>("/api/events/results", {
  query: { edId, tour },
  default: () => []
})
</script>

<template>
  <div class="w-full">
    <events-results-cards
      v-if="viewMode === 'cards'"
      :matches
      :status
    />
    <events-results-table
      v-else
      :matches
      :status
    />
  </div>
</template>
