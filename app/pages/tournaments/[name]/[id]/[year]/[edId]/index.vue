<script setup lang="ts">
definePageMeta({ name: "edition" })
const {
  params: { name, year, edId }
} = useRoute("edition")
const { viewMode } = useViewMode()

const { data: edition, refresh } = await useFetch<EditionInterface>("/api/editions/edition", {
  query: { edId }
})
const { data: events, status } = await useFetch<EventInterface[]>("/api/events", {
  query: { edId: edId },
  default: () => []
})

useHead({ title: () => `${edition.value?.tournament.name ?? capitalCase(name)} ${year}` })
const tours = useState<(keyof typeof TourEnum)[]>("tours", () => edition.value?.tours ?? [])
</script>

<template>
  <div class="w-full">
    <template v-if="edition">
      <editions-cards
        v-if="viewMode === 'cards'"
        :edition
        :events
        :status
        :refresh
      />
      <editions-table
        v-else
        :edition
        :events
        :status
        :refresh
      />
    </template>
  </div>
</template>
