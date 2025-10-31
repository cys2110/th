<script setup lang="ts">
definePageMeta({ name: "event" })
const { viewMode } = useViewMode()
const {
  params: { tour, edId, name }
} = useRoute("event")

const { data: event } = await useFetch<EventInterface>("/api/events/event", {
  key: `${edId}-${tour}`,
  query: { id: `${edId}-${tour}` }
})

const tournamentName = useState<string>("tournamentName", () => event.value?.edition.tournament.name ?? capitalCase(name))
</script>

<template>
  <div class="w-full">
    <events-cards v-if="viewMode === 'cards'" />
    <events-table v-else />
  </div>
</template>
